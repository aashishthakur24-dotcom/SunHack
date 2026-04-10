"""
AGENT 6 — Conflict Detection Agent
═════════════════════════════════════
Responsibilities:
  • Cross-reference ALL stored sources for contradictions
  • Methods:
      1. Semantic contradiction  — cosine similarity in opposing directions
      2. GPT contradiction check — explicit pairwise NLI (Natural Language Inference)
      3. Graph path conflict     — CONFLICTS_WITH edges in Neo4j
  • Severity classification: low / medium / high / critical
  • Suggest resolution for each detected conflict
  • Write conflicts to Neo4j CONFLICTS_WITH edges
  • Return list of Conflict objects
"""
from __future__ import annotations

import json
import time
from itertools import combinations
from loguru import logger
from openai import AsyncOpenAI

from config import get_settings
from models import Conflict, Entity, AgentResult
from storage.chroma_store import ChromaStore
from storage.neo4j_store import Neo4jStore

cfg = get_settings()

CONFLICT_CHECK_PROMPT = """
You are a conflict detection engine for enterprise decision intelligence.

Compare these two statements and determine if they CONTRADICT each other.

Statement A (from: {src_a}):
{text_a}

Statement B (from: {src_b}):
{text_b}

Return JSON:
{{
  "is_conflict":   <true|false>,
  "severity":      <"low"|"medium"|"high"|"critical">,
  "description":   <short description of the conflict>,
  "resolution":    <suggested resolution>
}}
"""


class ConflictDetectionAgent:
    """
    Detects contradictions across sources using semantic + GPT-based NLI.
    Writes conflicts to Neo4j for graph-based conflict traversal.
    """

    def __init__(self, chroma: ChromaStore, neo4j: Neo4jStore):
        self._chroma = chroma
        self._neo4j  = neo4j
        self._client = AsyncOpenAI(api_key=cfg.openai_api_key)
        logger.info("ConflictDetectionAgent initialized (threshold={})", cfg.conflict_threshold)

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    async def scan_decision(self, decision_id: str, entities: list[Entity]) -> AgentResult:
        """Scan all entities of a given decision for conflicts."""
        t0 = time.perf_counter()
        conflicts: list[Conflict] = []
        try:
            # Step 1: Find semantically similar but potentially contradicting entities
            candidate_pairs = await self._find_candidate_pairs(entities)

            # Step 2: GPT NLI verification on top candidates (most similar)
            for a, b, score in candidate_pairs[:10]:  # limit GPT calls
                conflict = await self._verify_conflict(a, b, score)
                if conflict:
                    conflicts.append(conflict)
                    self._neo4j.save_conflict(conflict)

            # Step 3: Pull existing graph conflicts
            graph_conflicts = self._neo4j.get_all_conflicts()

            return AgentResult(
                agent="conflict_detection",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data={
                    "decision_id":    decision_id,
                    "new_conflicts":  [c.model_dump() for c in conflicts],
                    "total_in_graph": len(graph_conflicts),
                },
            )
        except Exception as e:
            logger.exception("ConflictDetectionAgent error")
            return AgentResult(agent="conflict_detection", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000,
                               data={}, error=str(e))

    async def scan_sources(self, source_excerpts: list[dict]) -> list[Conflict]:
        """
        Direct scan: given a list of {id, text, title} dicts,
        find all pairwise conflicts.
        """
        conflicts: list[Conflict] = []
        pairs = list(combinations(source_excerpts, 2))
        for a, b in pairs[:20]:  # cap at 20 pairs to control cost
            score = await self._semantic_similarity(a["text"], b["text"])
            if score < cfg.conflict_threshold:  # low similarity = potential conflict
                conflict = await self._verify_conflict_raw(
                    text_a=a["text"], src_a=a.get("title", a["id"]),
                    text_b=b["text"], src_b=b.get("title", b["id"]),
                    sim_score=score, source_a_id=a["id"], source_b_id=b["id"],
                )
                if conflict:
                    conflicts.append(conflict)
                    self._neo4j.save_conflict(conflict)
        return conflicts

    # ─────────────────────────────────────────────────────────────────────────
    # INTERNAL
    # ─────────────────────────────────────────────────────────────────────────

    async def _find_candidate_pairs(
        self, entities: list[Entity]
    ) -> list[tuple[Entity, Entity, float]]:
        """
        For each entity, query ChromaDB for near-neighbours and flag
        pairs with similarity in the "suspicious" range indicating contradiction.
        """
        from langchain_openai import OpenAIEmbeddings
        embedder = OpenAIEmbeddings(
            model=cfg.openai_embedding_model,
            api_key=cfg.openai_api_key
        )
        pairs: list[tuple[Entity, Entity, float]] = []
        seen: set[frozenset] = set()

        for ent in entities:
            text = f"{ent.label}: {ent.description}"
            emb = await embedder.aembed_query(text)
            hits = self._chroma.query(
                collection=cfg.chroma_collection_entities,
                query_embedding=emb,
                top_k=5,
            )
            for hit in hits:
                hit_id = hit["id"]
                if hit_id == ent.id:
                    continue
                score = hit.get("score", 1.0)
                # Suspicious range: somewhat similar (shared topic) but not identical
                # High similarity → saying the same thing; very low → unrelated
                if 0.30 < score < cfg.conflict_threshold:
                    key = frozenset([ent.id, hit_id])
                    if key not in seen:
                        seen.add(key)
                        other = Entity(
                            id=hit_id,
                            label=hit["metadata"].get("label", ""),
                            type="fact",
                            description=hit["document"],
                        )
                        pairs.append((ent, other, score))

        return sorted(pairs, key=lambda x: x[2])  # lowest similarity first

    async def _verify_conflict(
        self, entity_a: Entity, entity_b: Entity, similarity: float
    ) -> Conflict | None:
        return await self._verify_conflict_raw(
            text_a=f"{entity_a.label}: {entity_a.description}",
            src_a=entity_a.label,
            text_b=f"{entity_b.label}: {entity_b.description}",
            src_b=entity_b.label,
            sim_score=similarity,
            source_a_id=entity_a.source_ids[0] if entity_a.source_ids else entity_a.id,
            source_b_id=entity_b.source_ids[0] if entity_b.source_ids else entity_b.id,
        )

    async def _verify_conflict_raw(
        self, text_a: str, src_a: str,
        text_b: str, src_b: str,
        sim_score: float, source_a_id: str, source_b_id: str,
    ) -> Conflict | None:
        """GPT NLI verification for a pair of texts."""
        prompt = CONFLICT_CHECK_PROMPT.format(
            src_a=src_a, text_a=text_a[:600],
            src_b=src_b, text_b=text_b[:600],
        )
        try:
            resp = await self._client.chat.completions.create(
                model=cfg.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                response_format={"type": "json_object"},
            )
            raw = json.loads(resp.choices[0].message.content)
            if not raw.get("is_conflict", False):
                return None

            return Conflict(
                severity=raw.get("severity", "medium"),
                description=raw.get("description", "Contradiction detected"),
                entity_a=src_a,
                entity_b=src_b,
                source_a_id=source_a_id,
                source_b_id=source_b_id,
                similarity_score=sim_score,
                suggested_resolution=raw.get("resolution", ""),
            )
        except Exception as e:
            logger.warning("ConflictAgent GPT verify failed: {}", e)
            return None

    async def _semantic_similarity(self, text_a: str, text_b: str) -> float:
        from langchain_openai import OpenAIEmbeddings
        import numpy as np
        embedder = OpenAIEmbeddings(model=cfg.openai_embedding_model, api_key=cfg.openai_api_key)
        embs = await embedder.aembed_documents([text_a[:500], text_b[:500]])
        a, b = np.array(embs[0]), np.array(embs[1])
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))
