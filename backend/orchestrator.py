"""
LangGraph Multi-Agent Orchestrator
════════════════════════════════════
Wires all 7 agents into a directed graph:

  Ingest → Reason → Memory → [Conflict] → Query → Explain
                                  ↓
                            [Intelligence]

Uses LangGraph StateGraph for reliable agent chaining with error handling.
"""
from __future__ import annotations

from typing import TypedDict, Annotated, Any
from loguru import logger

from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage

from agents.ingestion_agent     import IngestionAgent
from agents.reasoning_agent     import ReasoningAgent
from agents.memory_agent        import MemoryAgent
from agents.query_agent         import QueryAgent
from agents.explainability_agent import ExplainabilityAgent
from agents.conflict_agent      import ConflictDetectionAgent
from agents.intelligence_agent  import IntelligenceAgent
from models import RawDocument, QueryRequest, AgentResult
from storage.chroma_store import ChromaStore
from storage.neo4j_store  import Neo4jStore


# ── Shared graph state ────────────────────────────────────────────────────────

class PipelineState(TypedDict):
    # Input
    raw_documents:  list[dict]
    query:          str
    include_whatif: bool
    whatif_variable: str
    whatif_change:   str

    # Agent outputs
    ingestion_results:   list[dict]
    decisions:           list[dict]
    memory_results:      list[dict]
    conflicts:           list[dict]
    query_context:       dict
    final_answer:        dict
    whatif_result:       dict

    # Meta
    errors: list[str]
    tokens_used: int


# ── Orchestrator ──────────────────────────────────────────────────────────────

class AgentOrchestrator:
    """
    LangGraph-based orchestrator for the full 7-agent pipeline.
    """

    def __init__(self):
        self._chroma  = ChromaStore()
        self._neo4j   = Neo4jStore()
        self._ingest  = IngestionAgent()
        self._reason  = ReasoningAgent()
        self._memory  = MemoryAgent(self._chroma, self._neo4j)
        self._conflict = ConflictDetectionAgent(self._chroma, self._neo4j)
        self._query   = QueryAgent(self._memory, self._neo4j)
        self._explain = ExplainabilityAgent()
        self._intel   = IntelligenceAgent(self._neo4j)

        self._graph = self._build_graph()
        logger.info("AgentOrchestrator ready — 7 agents wired")

    # ── LangGraph construction ────────────────────────────────────────────────

    def _build_graph(self):
        g = StateGraph(PipelineState)

        g.add_node("ingest",      self._node_ingest)
        g.add_node("reason",      self._node_reason)
        g.add_node("memory",      self._node_memory)
        g.add_node("conflict",    self._node_conflict)
        g.add_node("query_agent", self._node_query)
        g.add_node("explain",     self._node_explain)
        g.add_node("whatif",      self._node_whatif)

        g.set_entry_point("ingest")
        g.add_edge("ingest",   "reason")
        g.add_edge("reason",   "memory")
        g.add_edge("memory",   "conflict")
        g.add_edge("conflict", "query_agent")
        g.add_edge("query_agent", "explain")
        g.add_conditional_edges(
            "explain",
            lambda s: "whatif" if s.get("include_whatif") and s.get("whatif_variable") else END,
            {"whatif": "whatif", END: END},
        )
        g.add_edge("whatif", END)

        return g.compile()

    # ── Node implementations ──────────────────────────────────────────────────

    async def _node_ingest(self, state: PipelineState) -> dict:
        results = []
        for doc_data in state.get("raw_documents", []):
            r = await self._ingest.ingest(**doc_data)
            results.append(r.data)
        return {"ingestion_results": results, "errors": state.get("errors", [])}

    async def _node_reason(self, state: PipelineState) -> dict:
        decisions = []
        for ingested in state.get("ingestion_results", []):
            doc_data = ingested.get("document", {})
            if not doc_data:
                continue
            doc = RawDocument(**doc_data)
            r = await self._reason.analyze(doc)
            if r.success:
                decisions.append(r.data)
        return {"decisions": decisions}

    async def _node_memory(self, state: PipelineState) -> dict:
        from models import DecisionIntelligence
        results = []
        for d in state.get("decisions", []):
            decision = DecisionIntelligence(**d)
            r = await self._memory.store_decision(decision)
            results.append(r.data)
        return {"memory_results": results}

    async def _node_conflict(self, state: PipelineState) -> dict:
        from models import DecisionIntelligence, Entity
        all_conflicts = []
        for d in state.get("decisions", []):
            decision = DecisionIntelligence(**d)
            entities = [Entity(**e) for e in d.get("entities", [])]
            r = await self._conflict.scan_decision(decision.id, entities)
            if r.success:
                all_conflicts.extend(r.data.get("new_conflicts", []))
        return {"conflicts": all_conflicts}

    async def _node_query(self, state: PipelineState) -> dict:
        query = state.get("query", "")
        if not query:
            return {"query_context": {}}
        req = QueryRequest(query=query, include_graph=True)
        r = await self._query.retrieve(req)
        return {"query_context": r.data if r.success else {}}

    async def _node_explain(self, state: PipelineState) -> dict:
        from models import SourceReference, Conflict
        ctx = state.get("query_context", {})
        query = state.get("query", "")
        if not query or not ctx:
            return {"final_answer": {}}

        source_refs = [SourceReference(**s) for s in ctx.get("source_refs", [])]
        conflicts   = [Conflict(**c) for c in state.get("conflicts", [])]

        r = await self._explain.explain(
            query=query,
            semantic_hits=ctx.get("semantic_hits", []),
            source_refs=source_refs,
            graph_path=ctx.get("graph_path", []),
            conflicts=conflicts[:3],
        )
        return {"final_answer": r.data if r.success else {}, "tokens_used": r.tokens_used}

    async def _node_whatif(self, state: PipelineState) -> dict:
        from models import DecisionIntelligence
        decisions = state.get("decisions", [])
        if not decisions:
            return {"whatif_result": {}}
        decision = DecisionIntelligence(**decisions[0])
        r = await self._intel.simulate(
            decision=decision,
            variable=state.get("whatif_variable", ""),
            change_description=state.get("whatif_change", ""),
        )
        return {"whatif_result": r.data if r.success else {}}

    # ── Public run methods ────────────────────────────────────────────────────

    async def run_full_pipeline(
        self,
        raw_documents: list[dict],
        query: str = "",
        include_whatif: bool = False,
        whatif_variable: str = "",
        whatif_change: str = "",
    ) -> dict:
        initial_state: PipelineState = {
            "raw_documents":     raw_documents,
            "query":             query,
            "include_whatif":    include_whatif,
            "whatif_variable":   whatif_variable,
            "whatif_change":     whatif_change,
            "ingestion_results": [],
            "decisions":         [],
            "memory_results":    [],
            "conflicts":         [],
            "query_context":     {},
            "final_answer":      {},
            "whatif_result":     {},
            "errors":            [],
            "tokens_used":       0,
        }
        final_state = await self._graph.ainvoke(initial_state)
        return final_state

    async def run_query_only(self, query: str) -> dict:
        """Fast path: query existing memory without ingestion."""
        req   = QueryRequest(query=query, include_graph=True)
        qr    = await self._query.retrieve(req)
        if not qr.success:
            return {"error": qr.error}
        from models import SourceReference
        source_refs = [SourceReference(**s) for s in qr.data.get("source_refs", [])]
        er = await self._explain.explain(
            query=query,
            semantic_hits=qr.data.get("semantic_hits", []),
            source_refs=source_refs,
            graph_path=qr.data.get("graph_path", []),
        )
        return er.data if er.success else {"error": er.error}

    async def run_whatif(self, decision_id: str, variable: str, change: str) -> dict:
        """Direct what-if for an existing decision by ID."""
        from models import DecisionIntelligence
        # Retrieve decision from memory
        hits = await self._memory.semantic_search(decision_id, top_k=1)
        if not hits:
            return {"error": "Decision not found"}
        meta = hits[0].get("metadata", {})
        decision = DecisionIntelligence(
            id=decision_id,
            title=meta.get("title", ""),
            summary=hits[0].get("document", ""),
            rationale="",
            confidence=meta.get("confidence", 0.7),
        )
        r = await self._intel.simulate(decision, variable, change)
        return r.data if r.success else {"error": r.error}

    def shutdown(self):
        self._neo4j.close()
