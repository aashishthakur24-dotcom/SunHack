"""
AGENT 3 — Memory Agent
══════════════════════
Responsibilities:
  • Receive DecisionIntelligence from the Reasoning Agent
  • Store in HYBRID memory:
      ┌─────────────────────────────────────────────┐
      │  ChromaDB   → semantic / vector search      │
      │  Neo4j      → relational graph traversal    │
      └─────────────────────────────────────────────┘
  • Embed decision summaries, entity descriptions, and source excerpts
  • Write entity and relationship nodes to the Neo4j graph
  • Provide a unified retrieve() API for the Query Agent
"""
from __future__ import annotations

import time
from loguru import logger
from langchain_openai import OpenAIEmbeddings

from config import get_settings
from models import DecisionIntelligence, RawDocument, AgentResult
from storage.chroma_store import ChromaStore
from storage.neo4j_store import Neo4jStore

cfg = get_settings()


class MemoryAgent:
    """
    Hybrid Memory: ChromaDB (semantic) + Neo4j (relational).
    Acts as the long-term knowledge store for the entire agent pipeline.
    """

    def __init__(self, chroma: ChromaStore, neo4j: Neo4jStore):
        self._chroma  = chroma
        self._neo4j   = neo4j
        self._embedder = OpenAIEmbeddings(
            model=cfg.openai_embedding_model,
            api_key=cfg.openai_api_key
        )
        logger.info("MemoryAgent initialized (hybrid: ChromaDB + Neo4j)")

    # ─────────────────────────────────────────────────────────────────────────
    # STORE
    # ─────────────────────────────────────────────────────────────────────────

    async def store_decision(self, decision: DecisionIntelligence) -> AgentResult:
        t0 = time.perf_counter()
        try:
            # 1. Embed and write to ChromaDB
            await self._store_in_chroma(decision)

            # 2. Write graph to Neo4j
            self._neo4j.save_decision(decision)

            return AgentResult(
                agent="memory",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data={"decision_id": decision.id, "entity_count": len(decision.entities)},
            )
        except Exception as e:
            logger.exception("MemoryAgent store error")
            return AgentResult(agent="memory", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000,
                               data={}, error=str(e))

    async def store_source(self, doc: RawDocument) -> None:
        """Store raw source document for retrieval."""
        embedding = await self._embed_text(doc.content[:2000])
        self._chroma.upsert(
            collection=cfg.chroma_collection_sources,
            ids=[doc.id],
            embeddings=[embedding],
            documents=[doc.content[:1000]],
            metadatas=[{
                "title":       doc.title,
                "source_type": doc.source_type,
                "author":      doc.author or "",
                "created_at":  str(doc.created_at),
            }],
        )

    # ─────────────────────────────────────────────────────────────────────────
    # RETRIEVE
    # ─────────────────────────────────────────────────────────────────────────

    async def semantic_search(
        self,
        query: str,
        collection: str = None,
        top_k: int = 5,
    ) -> list[dict]:
        """Semantic vector search via ChromaDB."""
        collection = collection or cfg.chroma_collection_decisions
        embedding = await self._embed_text(query)
        return self._chroma.query(collection, embedding, top_k=top_k)

    def graph_search(
        self,
        entity_label: str,
        depth: int = 2,
    ) -> list[dict]:
        """Relational traversal via Neo4j."""
        return self._neo4j.find_related_entities(entity_label, depth=depth)

    async def hybrid_retrieve(
        self,
        query: str,
        entity_label: str = "",
        top_k: int = 5,
    ) -> dict:
        """
        Combined semantic + graph retrieval.
        Returns merged results with provenance labels.
        """
        semantic_hits = await self.semantic_search(query, top_k=top_k)
        graph_hits    = self.graph_search(entity_label or query.split()[0], depth=2) if entity_label else []

        return {
            "semantic": semantic_hits,
            "graph":    graph_hits,
        }

    def get_decision_graph(self, decision_id: str) -> dict:
        return self._neo4j.get_decision_graph(decision_id)

    def get_all_conflicts(self) -> list[dict]:
        return self._neo4j.get_all_conflicts()

    # ─────────────────────────────────────────────────────────────────────────
    # INTERNAL
    # ─────────────────────────────────────────────────────────────────────────

    async def _embed_text(self, text: str) -> list[float]:
        return await self._embedder.aembed_query(text)

    async def _store_in_chroma(self, decision: DecisionIntelligence) -> None:
        # Decision-level embedding
        decision_text = f"{decision.title}. {decision.summary}. {decision.rationale}"
        decision_emb  = await self._embed_text(decision_text)
        self._chroma.upsert(
            collection=cfg.chroma_collection_decisions,
            ids=[decision.id],
            embeddings=[decision_emb],
            documents=[decision_text],
            metadatas=[{
                "title":        decision.title,
                "decision_maker": decision.decision_maker or "",
                "confidence":   decision.confidence,
                "created_at":   str(decision.created_at),
            }],
        )

        # Entity-level embeddings (for fine-grained retrieval)
        if decision.entities:
            entity_texts  = [f"{e.label}: {e.description}" for e in decision.entities]
            entity_embeddings = await self._embedder.aembed_documents(entity_texts)
            self._chroma.upsert(
                collection=cfg.chroma_collection_entities,
                ids=[e.id for e in decision.entities],
                embeddings=entity_embeddings,
                documents=entity_texts,
                metadatas=[{
                    "type":        e.type,
                    "label":       e.label,
                    "decision_id": decision.id,
                    "confidence":  e.confidence,
                } for e in decision.entities],
            )
        logger.debug("Stored decision {} in ChromaDB ({} entities)", decision.id, len(decision.entities))
