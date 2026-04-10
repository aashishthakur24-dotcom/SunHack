"""
AGENT 2 — Reasoning Agent (GPT-powered)
════════════════════════════════════════
Responsibilities:
  • Receive RawDocument(s) from the Ingestion Agent
  • Extract decision intelligence via structured GPT prompting:
      - What was decided
      - Why (rationale)
      - By whom (decision maker)
      - Stakeholders involved
      - Alternatives that were considered
      - Constraints / blockers
      - Confidence score
  • Identify explicit and implicit relationships between entities
  • Emit DecisionIntelligence objects downstream to the Memory Agent
"""
from __future__ import annotations

import json
import time
from typing import Optional
from loguru import logger
from openai import AsyncOpenAI

from config import get_settings
from models import (
    RawDocument, DecisionIntelligence, Entity, Relationship, AgentResult, NodeType
)

cfg = get_settings()

# ── Structured extraction prompt ──────────────────────────────────────────────

DECISION_EXTRACTION_PROMPT = """
You are a Decision Intelligence extraction engine.

Analyze the following document and extract:
1. "title"         — short decision title (< 10 words)
2. "summary"       — 2-3 sentence summary of the decision
3. "rationale"     — WHY this decision was made
4. "decision_maker"— who made the final call (name or role)
5. "stakeholders"  — list of affected parties (strings)
6. "alternatives"  — list of alternatives that were considered (strings)
7. "constraints"   — list of blockers, risks, or constraints (strings)
8. "confidence"    — your confidence 0.0–1.0 that this IS a decision (vs. just discussion)
9. "entities"      — array of {{label, type, description}} where type in: decision, stakeholder, fact, conflict, hypothesis, action
10. "relationships"— array of {{source, relation, target, evidence}} where relation in: SUPPORTS, CONFLICTS_WITH, MADE_BY, LEADS_TO, BLOCKED_BY, DEPENDS_ON

Return ONLY valid JSON. No markdown. No explanation.

Document source: {source_type}
Author: {author}
---
{content}
"""


class ReasoningAgent:
    """
    GPT-4o powered Reasoning Agent.
    Transforms raw ingested documents into structured DecisionIntelligence.
    """

    def __init__(self):
        self._client = AsyncOpenAI(api_key=cfg.openai_api_key)
        logger.info("ReasoningAgent initialized (model={})", cfg.openai_model)

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    async def analyze(self, doc: RawDocument) -> AgentResult:
        t0 = time.perf_counter()
        try:
            raw, tokens = await self._extract(doc)
            decision    = self._parse(raw, doc)
            return AgentResult(
                agent="reasoning",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data=decision.model_dump(),
                tokens_used=tokens,
            )
        except Exception as e:
            logger.exception("ReasoningAgent error for doc {}", doc.id)
            return AgentResult(
                agent="reasoning", success=False,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data={}, error=str(e)
            )

    async def analyze_batch(self, docs: list[RawDocument]) -> list[AgentResult]:
        import asyncio
        return await asyncio.gather(*[self.analyze(d) for d in docs])

    # ─────────────────────────────────────────────────────────────────────────
    # INTERNAL
    # ─────────────────────────────────────────────────────────────────────────

    async def _extract(self, doc: RawDocument) -> tuple[dict, int]:
        """Call GPT with structured extraction prompt."""
        prompt = DECISION_EXTRACTION_PROMPT.format(
            source_type=doc.source_type,
            author=doc.author or "Unknown",
            content=doc.content[:6000],   # stay within context window
        )
        community_context = ""
        summaries = doc.metadata.get("community_summaries", [])
        if summaries:
            community_context = "\n\nGraphRAG communities detected:\n" + "\n".join(summaries[:5])

        resp = await self._client.chat.completions.create(
            model=cfg.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an enterprise decision-intelligence extraction system. "
                        "You analyze business communications and extract structured decision data. "
                        "Always output valid JSON matching the schema described."
                    ),
                },
                {"role": "user", "content": prompt + community_context},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content
        tokens  = resp.usage.total_tokens
        return json.loads(content), tokens

    def _parse(self, raw: dict, doc: RawDocument) -> DecisionIntelligence:
        """Convert raw GPT JSON into a typed DecisionIntelligence object."""
        # Build entities
        entities: list[Entity] = []
        entity_map: dict[str, str] = {}   # label → id
        for e in raw.get("entities", []):
            ent = Entity(
                label=e.get("label", ""),
                type=self._coerce_node_type(e.get("type", "fact")),
                description=e.get("description", ""),
                confidence=0.9,
                source_ids=[doc.id],
            )
            entities.append(ent)
            entity_map[ent.label.lower()] = ent.id

        # Build relationships
        relationships: list[Relationship] = []
        for r in raw.get("relationships", []):
            src_id = entity_map.get(r.get("source", "").lower())
            tgt_id = entity_map.get(r.get("target", "").lower())
            if src_id and tgt_id:
                relationships.append(Relationship(
                    source_entity_id=src_id,
                    target_entity_id=tgt_id,
                    relation=r.get("relation", "RELATES_TO"),
                    evidence=r.get("evidence", ""),
                    confidence=0.85,
                ))

        return DecisionIntelligence(
            title=raw.get("title", doc.title),
            summary=raw.get("summary", ""),
            rationale=raw.get("rationale", ""),
            decision_maker=raw.get("decision_maker"),
            stakeholders=raw.get("stakeholders", []),
            alternatives_considered=raw.get("alternatives", []),
            constraints=raw.get("constraints", []),
            confidence=float(raw.get("confidence", 0.7)),
            source_ids=[doc.id],
            entities=entities,
            relationships=relationships,
        )

    @staticmethod
    def _coerce_node_type(raw: str) -> NodeType:
        mapping = {
            "decision": "decision", "stakeholder": "stakeholder",
            "fact": "fact", "conflict": "conflict",
            "hypothesis": "hypothesis", "action": "action",
        }
        return mapping.get(raw.lower(), "fact")
