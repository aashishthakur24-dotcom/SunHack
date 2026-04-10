"""
AGENT 5 — Explainability Agent
═══════════════════════════════
Responsibilities:
  • Receive query context bundle from the Query Agent
  • Generate a transparent, grounded answer using GPT with RAG
  • Produce a step-by-step reasoning chain (chain-of-thought)
  • Attach supporting source citations with relevance scores
  • Return a confidence score based on source agreement
  • Flag any conflicts found in the retrieved context
"""
from __future__ import annotations

import json
import time
from loguru import logger
from openai import AsyncOpenAI

from config import get_settings
from models import (
    ExplainableAnswer, SourceReference, Conflict, AgentResult
)

cfg = get_settings()

SYSTEM_PROMPT = """
You are DecisionDNA's Explainability Engine — an enterprise-grade decision intelligence assistant.

Your rules:
1. ONLY use the provided context to answer. Never hallucinate.
2. Every factual claim MUST reference a source by its title.
3. Think step-by-step and expose your reasoning chain.
4. Score your confidence (0.0–1.0) based on source agreement.
5. Flag any contradictions you observe among the sources.
6. Keep the answer concise but complete. Use bullet points where helpful.
"""

RAG_PROMPT = """
USER QUERY:
{query}

RETRIEVED CONTEXT:
{context}

GRAPH PATH (entity chain):
{graph_path}

ACTIVE CONFLICTS:
{conflicts}

---
Return a JSON object with:
{{
  "answer":          <your answer string>,
  "confidence":      <float 0-1>,
  "reasoning_chain": [<step1>, <step2>, ...],
  "flags": [<any contradictions or caveats>]
}}
"""


class ExplainabilityAgent:
    """
    Generates transparent, source-grounded answers with full reasoning traces.
    """

    def __init__(self):
        self._client = AsyncOpenAI(api_key=cfg.openai_api_key)
        logger.info("ExplainabilityAgent initialized")

    async def explain(
        self,
        query: str,
        semantic_hits: list[dict],
        source_refs: list[SourceReference],
        graph_path: list[str],
        conflicts: list[Conflict] = None,
    ) -> AgentResult:
        t0 = time.perf_counter()
        try:
            context_block = self._build_context(semantic_hits, source_refs)
            path_str      = " → ".join(graph_path) if graph_path else "No graph path"
            conflict_str  = self._format_conflicts(conflicts or [])

            prompt = RAG_PROMPT.format(
                query=query,
                context=context_block,
                graph_path=path_str,
                conflicts=conflict_str,
            )

            resp = await self._client.chat.completions.create(
                model=cfg.openai_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            raw     = json.loads(resp.choices[0].message.content)
            tokens  = resp.usage.total_tokens

            answer = ExplainableAnswer(
                answer=raw.get("answer", "I could not generate an answer."),
                confidence=float(raw.get("confidence", 0.5)),
                reasoning_chain=raw.get("reasoning_chain", []),
                sources=source_refs,
                conflicts=conflicts or [],
                graph_path=graph_path,
            )

            return AgentResult(
                agent="explainability",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data=answer.model_dump(),
                tokens_used=tokens,
            )
        except Exception as e:
            logger.exception("ExplainabilityAgent error")
            return AgentResult(agent="explainability", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000,
                               data={}, error=str(e))

    # ─────────────────────────────────────────────────────────────────────────
    # INTERNAL
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _build_context(
        semantic_hits: list[dict],
        source_refs: list[SourceReference],
    ) -> str:
        lines = []
        for i, hit in enumerate(semantic_hits[:6], 1):
            meta = hit.get("metadata", {})
            title = meta.get("title", f"Source {i}")
            text  = hit.get("document", "")[:500]
            score = hit.get("score", 0.0)
            lines.append(f"[{i}] \"{title}\" (relevance: {score:.2f})\n{text}\n")
        return "\n".join(lines) or "No context available."

    @staticmethod
    def _format_conflicts(conflicts: list[Conflict]) -> str:
        if not conflicts:
            return "None detected."
        return "\n".join(
            f"• [{c.severity.upper()}] {c.description} "
            f"(Source A: {c.entity_a} vs Source B: {c.entity_b})"
            for c in conflicts[:5]
        )
