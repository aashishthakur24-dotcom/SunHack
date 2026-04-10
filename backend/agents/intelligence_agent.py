"""
AGENT 7 — Intelligence Agent (What-If Simulator)
═════════════════════════════════════════════════
Responsibilities:
  • Enable "what-if" scenario simulation on a base decision
  • Model how changing one variable propagates risk through the decision graph
  • Run multi-scenario comparison (side-by-side impact analysis)
  • Return confidence-adjusted impact forecasts per affected graph node
  • Use Neo4j graph traversal to trace propagation paths
  • GPT generates narrative impact summaries for each scenario
"""
from __future__ import annotations

import json
import time
from typing import Any
from loguru import logger
from openai import AsyncOpenAI

from config import get_settings
from models import WhatIfScenario, DecisionIntelligence, AgentResult
from storage.neo4j_store import Neo4jStore

cfg = get_settings()

WHATIF_PROMPT = """
You are a decision intelligence impact simulator.

BASE DECISION:
Title: {title}
Summary: {summary}
Rationale: {rationale}
Key Constraints: {constraints}

GRAPH CONTEXT (related entities):
{graph_entities}

SCENARIO CHANGE:
Variable: {variable}
Change: {change_description}

Analyze how this change would propagate through the decision. Output JSON:
{{
  "narrative_impact": <2-3 sentence impact description>,
  "risk_delta":       <float: change in overall risk, -1.0 to +1.0 (positive = more risk)>,
  "affected_nodes":   [<list of entity names affected>],
  "confidence":       <float 0-1>,
  "projected_impact": {{
    "timeline_change":    <string>,
    "cost_impact":        <string>,
    "stakeholder_effect": <string>,
    "compliance_risk":    <string>
  }}
}}
"""

MULTI_SCENARIO_PROMPT = """
You are comparing {n} "what-if" scenarios for the same base decision.
Base: {base_title}

Scenarios:
{scenarios_text}

Return JSON:
{{
  "recommendation": <which scenario is best and why>,
  "risk_ranking":   [<scenario ids from lowest to highest risk>],
  "summary_table":  [
    {{"scenario": <id>, "risk": <float>, "benefit": <string>, "main_risk": <string>}}
  ]
}}
"""


class IntelligenceAgent:
    """
    What-If Simulation and Multi-Scenario Impact Analysis.
    Uses Neo4j graph traversal for propagation paths + GPT for narrative.
    """

    def __init__(self, neo4j: Neo4jStore):
        self._neo4j  = neo4j
        self._client = AsyncOpenAI(api_key=cfg.openai_api_key)
        logger.info("IntelligenceAgent initialized")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    async def simulate(
        self,
        decision: DecisionIntelligence,
        variable: str,
        change_description: str,
    ) -> AgentResult:
        """Run a single what-if scenario."""
        t0 = time.perf_counter()
        try:
            # Get graph context for entity propagation
            graph_data = self._neo4j.get_decision_graph(decision.id)
            graph_text = self._format_graph(graph_data)

            prompt = WHATIF_PROMPT.format(
                title=decision.title,
                summary=decision.summary,
                rationale=decision.rationale,
                constraints="; ".join(decision.constraints[:5]),
                graph_entities=graph_text,
                variable=variable,
                change_description=change_description,
            )

            resp = await self._client.chat.completions.create(
                model=cfg.openai_model,
                messages=[
                    {"role": "system", "content": "You are a precise decision risk simulation engine. Always output valid JSON."},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )

            raw    = json.loads(resp.choices[0].message.content)
            tokens = resp.usage.total_tokens

            scenario = WhatIfScenario(
                base_decision_id=decision.id,
                variable=variable,
                change_description=change_description,
                projected_impact=raw.get("projected_impact", {}),
                risk_delta=float(raw.get("risk_delta", 0.0)),
                affected_nodes=raw.get("affected_nodes", []),
                confidence=float(raw.get("confidence", 0.7)),
            )
            scenario_dict = scenario.model_dump()
            scenario_dict["narrative_impact"] = raw.get("narrative_impact", "")

            return AgentResult(
                agent="intelligence",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data=scenario_dict,
                tokens_used=tokens,
            )
        except Exception as e:
            logger.exception("IntelligenceAgent simulate error")
            return AgentResult(agent="intelligence", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000,
                               data={}, error=str(e))

    async def compare_scenarios(
        self,
        decision: DecisionIntelligence,
        scenarios: list[dict],  # list of {variable, change_description}
    ) -> AgentResult:
        """Run multiple what-if scenarios and return a comparative analysis."""
        t0 = time.perf_counter()
        try:
            import asyncio
            results = await asyncio.gather(*[
                self.simulate(decision, s["variable"], s["change_description"])
                for s in scenarios
            ])

            scenario_results = [r.data for r in results if r.success]
            scenarios_text = "\n\n".join(
                f"Scenario {i+1} ({s.get('variable','')}):\n"
                f"  Risk delta: {s.get('risk_delta', 0):.2f}\n"
                f"  Affected: {', '.join(s.get('affected_nodes', [])[:4])}\n"
                f"  Impact: {s.get('narrative_impact', '')}"
                for i, s in enumerate(scenario_results)
            )

            compare_prompt = MULTI_SCENARIO_PROMPT.format(
                n=len(scenario_results),
                base_title=decision.title,
                scenarios_text=scenarios_text,
            )

            resp = await self._client.chat.completions.create(
                model=cfg.openai_model,
                messages=[
                    {"role": "system", "content": "You are a strategic decision advisor. Output valid JSON."},
                    {"role": "user",   "content": compare_prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )

            comparison = json.loads(resp.choices[0].message.content)

            return AgentResult(
                agent="intelligence",
                success=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                data={
                    "scenarios":   scenario_results,
                    "comparison":  comparison,
                    "decision_id": decision.id,
                },
                tokens_used=resp.usage.total_tokens,
            )
        except Exception as e:
            logger.exception("IntelligenceAgent compare error")
            return AgentResult(agent="intelligence", success=False,
                               duration_ms=(time.perf_counter() - t0) * 1000,
                               data={}, error=str(e))

    async def risk_propagation_map(self, decision_id: str) -> dict[str, Any]:
        """
        Returns risk scores for all nodes in the decision graph,
        simulated as a breadth-first propagation from highest-risk entity.
        """
        graph_data = self._neo4j.get_decision_graph(decision_id)
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])

        if not nodes:
            return {"nodes": [], "edges": [], "propagation": []}

        # Simple propagation model: assign base risk, decay by hop
        risk_map: dict[str, float] = {}
        for n in nodes:
            base = 0.9 if n.get("type") == "conflict" else \
                   0.7 if n.get("type") == "decision" else \
                   0.4 if n.get("type") == "action" else 0.2
            risk_map[n["id"]] = base

        # Propagate: influenced_risk = max(own, neighbour * 0.7)
        for _ in range(3):  # 3 propagation hops
            for e in edges:
                src, tgt = e.get("source"), e.get("target")
                if src in risk_map and tgt in risk_map:
                    risk_map[tgt] = max(risk_map[tgt], risk_map[src] * 0.7)

        return {
            "nodes": [{"id": n["id"], "label": n["label"], "type": n["type"], "risk": risk_map.get(n["id"], 0)} for n in nodes],
            "edges": edges,
            "propagation": sorted(risk_map.items(), key=lambda x: x[1], reverse=True)[:10],
        }

    @staticmethod
    def _format_graph(graph_data: dict) -> str:
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])
        node_str = "\n".join(f"  [{n.get('type','?')}] {n.get('label','')}" for n in nodes[:12])
        edge_str = "\n".join(f"  {e.get('source','')} --{e.get('relation','')}-> {e.get('target','')}" for e in edges[:10])
        return f"Nodes:\n{node_str}\n\nEdges:\n{edge_str}"
