"""
ChromaDB Storage Layer
Wraps ChromaDB for semantic vector search used by Memory Agent and Query Agent.
"""
from __future__ import annotations
import chromadb
from chromadb.config import Settings as ChromaSettings
from loguru import logger
from typing import Optional
from config import get_settings

cfg = get_settings()


class ChromaStore:
    """Manages all ChromaDB collections for DecisionDNA."""

    def __init__(self):
        try:
            self._client = chromadb.HttpClient(
                host=cfg.chroma_host,
                port=cfg.chroma_port,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        except Exception:
            # Fallback to ephemeral in-process client (dev mode)
            logger.warning("ChromaDB HTTP server not reachable — using ephemeral in-process client")
            self._client = chromadb.EphemeralClient(
                settings=ChromaSettings(anonymized_telemetry=False)
            )

        self._collections: dict[str, chromadb.Collection] = {}
        self._ensure_collections()

    def _ensure_collections(self):
        for name in [
            cfg.chroma_collection_decisions,
            cfg.chroma_collection_sources,
            cfg.chroma_collection_entities,
        ]:
            self._collections[name] = self._client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"},
            )
        logger.info("ChromaDB collections ready: {}", list(self._collections.keys()))

    # ── Upsert ────────────────────────────────────────────────────────────────

    def upsert(
        self,
        collection: str,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: Optional[list[dict]] = None,
    ) -> None:
        col = self._collections[collection]
        col.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas or [{} for _ in ids],
        )
        logger.debug("Upserted {} docs into '{}'", len(ids), collection)

    # ── Semantic Search ───────────────────────────────────────────────────────

    def query(
        self,
        collection: str,
        query_embedding: list[float],
        top_k: int = 5,
        where: Optional[dict] = None,
    ) -> list[dict]:
        col = self._collections[collection]
        results = col.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        output = []
        for i, doc_id in enumerate(results["ids"][0]):
            output.append({
                "id":       doc_id,
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i],
                "score":    1 - results["distances"][0][i],  # cosine → similarity
            })
        return output

    def delete(self, collection: str, ids: list[str]) -> None:
        self._collections[collection].delete(ids=ids)

    def count(self, collection: str) -> int:
        return self._collections[collection].count()

    def get_collection(self, name: str) -> chromadb.Collection:
        return self._collections[name]
