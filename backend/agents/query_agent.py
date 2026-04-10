"""
AGENT 4 — Query Agent
═════════════════════
Responsibilities:
  • Accept natural language user queries
  • Retrieve BOTH semantic (ChromaDB) AND relational (Neo4j) context
  • Rank and merge retrieved contexts by relevance
  • Emit a unified context bundle to the Explainability Agent
  • Support scoped queries (by decision_ids) and open queries
"""
from __future__ import annotations

import time
from typing import Optional
from loguru import logger

from config import get_settings
from models import QueryRequest, SourceReference, AgentResult
from agents.memory_agent import MemoryAgent
from storage.neo4j_store import Neo4jStore

cfg = get_settings()


class QueryAgent:
    """
    Retrieves both semantic and relational context for a user query.
    Acts as the retrieval layer feeding into the Explainability Agent.
    """

    def __init__(self, memory: MemoryAgent, neo4j: Neo4jStore):
        self._memory = memory
        self._neo4j  = neo4j
        logger.info("QueryAgent initialized")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    async def retrieve(self, request: QueryRequest) -> AgentResult:
        t0 = time.perf_counter()
        try:
            # 1. Semantic retrieval from ChromaDB
            semantic_hits = await self._memory.semantic_search(
                query=request.query,
                top_k=request.top_k,
            )

            # 2. Source-level semantic (for citations)
            source_hits = await self._memory.semantic_search(
                query=request.query,
                collection=cfg.chroma_collection_sources,
                top_k=request.top_k,
            )

            # 3. Graph traversal from Neo4j (extract key noun as seed entity)
            graph_context: list[dict] = []
            graph_path: list[str] = []
            if request.include_graph:
                seed = self._extract_seed_entity(request.query)
                graph_context = self._memory.graph_search(seed, depth=2)

                # Try to trace a path if we have 2+ semantic hits
                if len(semantic_hits) >= 2:
                    label_a = semantic_hits[0].get("metadata", {}).get("title", "")
                    label_b = semantic_hits[1].get("metadata", {}).get("title", "")
                    if label_a and label_b:
                        graph_path = self._neo4j.shortest_path(label_a, label_b)

            # 4. Merge + deduplicate
            sources = self._build_source_references(semantic_hits, source_hits)

            return AgentResult(
                agent="query",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data={
                    "query":          request.query,
                    "semantic_hits":  semantic_hits,
                    "source_refs":    [s.model_dump() for s in sources],
                    "graph_context":  graph_context,
                    "graph_path":     graph_path,
                    "hit_count":      len(semantic_hits),
                },
            )
        except Exception as e:
            logger.exception("QueryAgent error")
            return AgentResult(agent="query", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000,
                               data={}, error=str(e))

    # ─────────────────────────────────────────────────────────────────────────
    # INTERNAL
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_seed_entity(query: str) -> str:
        """Extract the first capitalised noun phrase as the graph seed entity."""
        import re
        matches = re.findall(r"\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*", query)
        return matches[0] if matches else query.split()[0]

    @staticmethod
    def _build_source_references(
        semantic_hits: list[dict],
        source_hits: list[dict],
    ) -> list[SourceReference]:
        seen: set[str] = set()
        refs: list[SourceReference] = []

        for hit in source_hits:
            sid = hit.get("id", "")
            if sid in seen:
                continue
            seen.add(sid)
            meta = hit.get("metadata", {})
            refs.append(SourceReference(
                source_id=sid,
                source_type=meta.get("source_type", "manual"),
                title=meta.get("title", "Unknown Source"),
                excerpt=hit.get("document", "")[:300],
                relevance_score=hit.get("score", 0.0),
            ))

        # Supplement with decision titles from semantic hits
        for hit in semantic_hits:
            sid = hit.get("id", "")
            if sid in seen:
                continue
            seen.add(sid)
            meta = hit.get("metadata", {})
            refs.append(SourceReference(
                source_id=sid,
                source_type="manual",
                title=meta.get("title", "Decision"),
                excerpt=hit.get("document", "")[:300],
                relevance_score=hit.get("score", 0.0),
            ))

        return sorted(refs, key=lambda r: r.relevance_score, reverse=True)[:8]
