"""
Agentic automation service for triggerable playbooks.

This layer turns the orchestrator into a worker-style automation system
with explicit runs, approvals, and action proposals.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from orchestrator import AgentOrchestrator


TriggerType = Literal["manual", "webhook", "schedule"]
RunStatus = Literal[
    "queued",
    "running",
    "awaiting_approval",
    "completed",
    "failed",
    "rejected",
]


class AutomationDocument(BaseModel):
    content: str
    source_type: str = "manual"
    title: str = "Untitled"
    author: Optional[str] = None
    thread_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AutomationPolicy(BaseModel):
    confidence_threshold: float = 0.7
    auto_apply: bool = False
    require_human_approval: bool = True
    max_conflicts_to_auto_block: int = 1


class AutomationPlaybook(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str = ""
    objective: str
    query: str = ""
    trigger: TriggerType = "manual"
    include_whatif: bool = False
    whatif_variable: str = ""
    whatif_change: str = ""
    documents: list[AutomationDocument] = Field(default_factory=list)
    enabled: bool = True
    policy: AutomationPolicy = Field(default_factory=AutomationPolicy)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AutomationAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: Literal["review_conflict", "approve_decision", "notify", "simulate"]
    title: str
    details: str
    requires_approval: bool = True
    status: Literal["proposed", "approved", "executed", "rejected"] = "proposed"


class AutomationRun(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    playbook_id: str
    status: RunStatus = "queued"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    finished_at: Optional[datetime] = None
    summary: str = ""
    output: dict[str, Any] = Field(default_factory=dict)
    actions: list[AutomationAction] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)


class AutomationService:
    def __init__(self, orchestrator: AgentOrchestrator):
        self._orchestrator = orchestrator
        self._playbooks: dict[str, AutomationPlaybook] = {}
        self._runs: dict[str, AutomationRun] = {}

    def list_playbooks(self) -> list[AutomationPlaybook]:
        return list(self._playbooks.values())

    def get_playbook(self, playbook_id: str) -> Optional[AutomationPlaybook]:
        return self._playbooks.get(playbook_id)

    def create_playbook(self, playbook: AutomationPlaybook) -> AutomationPlaybook:
        if not playbook.query:
            playbook.query = f"Summarize key outcomes for automation objective: {playbook.objective}"
        playbook.updated_at = datetime.now(timezone.utc)
        self._playbooks[playbook.id] = playbook
        return playbook

    def get_run(self, run_id: str) -> Optional[AutomationRun]:
        return self._runs.get(run_id)

    async def run_playbook(
        self,
        playbook_id: str,
        documents: Optional[list[AutomationDocument]] = None,
    ) -> Optional[AutomationRun]:
        playbook = self._playbooks.get(playbook_id)
        if not playbook or not playbook.enabled:
            return None

        docs = documents if documents is not None else playbook.documents

        run = AutomationRun(playbook_id=playbook.id, status="running")
        self._runs[run.id] = run

        try:
            result = await self._orchestrator.run_full_pipeline(
                raw_documents=[d.model_dump() for d in docs],
                query=playbook.query,
                include_whatif=playbook.include_whatif,
                whatif_variable=playbook.whatif_variable,
                whatif_change=playbook.whatif_change,
            )
            run.output = result
            run.actions = self._build_actions(result, playbook)

            if self._should_block_for_approval(run, playbook):
                run.status = "awaiting_approval"
                run.summary = "Automation produced actions and is waiting for human approval."
            else:
                for action in run.actions:
                    action.status = "executed" if playbook.policy.auto_apply else "approved"
                run.status = "completed"
                run.summary = "Automation completed and actions were auto-approved."

        except Exception as exc:  # pragma: no cover - defensive runtime capture
            run.status = "failed"
            run.errors.append(str(exc))
            run.summary = "Automation failed during execution."

        run.finished_at = datetime.now(timezone.utc)
        return run

    def approve_run(self, run_id: str, approved: bool, note: str = "") -> Optional[AutomationRun]:
        run = self._runs.get(run_id)
        if not run or run.status != "awaiting_approval":
            return None

        for action in run.actions:
            action.status = "approved" if approved else "rejected"

        if approved:
            run.status = "completed"
            run.summary = f"Run approved. {note}".strip()
        else:
            run.status = "rejected"
            run.summary = f"Run rejected. {note}".strip()

        run.finished_at = datetime.now(timezone.utc)
        return run

    def _should_block_for_approval(self, run: AutomationRun, playbook: AutomationPlaybook) -> bool:
        if playbook.policy.require_human_approval:
            return True

        conflicts = run.output.get("conflicts", [])
        if len(conflicts) > playbook.policy.max_conflicts_to_auto_block:
            return True

        answer_confidence = (run.output.get("final_answer") or {}).get("confidence", 0)
        if answer_confidence < playbook.policy.confidence_threshold:
            return True

        return any(a.requires_approval for a in run.actions)

    def _build_actions(self, result: dict[str, Any], playbook: AutomationPlaybook) -> list[AutomationAction]:
        actions: list[AutomationAction] = []

        decisions = result.get("decisions", [])
        conflicts = result.get("conflicts", [])
        whatif = result.get("whatif_result", {})

        for d in decisions[:3]:
            title = d.get("title", "Decision")
            confidence = float(d.get("confidence", 0.0))
            actions.append(
                AutomationAction(
                    type="approve_decision",
                    title=f"Approve decision: {title}",
                    details=f"Proposed by automation for objective '{playbook.objective}' with confidence {confidence:.2f}.",
                    requires_approval=confidence < 0.9,
                )
            )

        for c in conflicts[:3]:
            actions.append(
                AutomationAction(
                    type="review_conflict",
                    title=f"Resolve conflict ({c.get('severity', 'unknown')})",
                    details=c.get("description", "Conflict detected by automation."),
                    requires_approval=True,
                )
            )

        if whatif:
            actions.append(
                AutomationAction(
                    type="simulate",
                    title="Review what-if simulation",
                    details="Automation generated what-if impact projections for this run.",
                    requires_approval=False,
                )
            )

        if not actions:
            actions.append(
                AutomationAction(
                    type="notify",
                    title="No direct action generated",
                    details="Automation completed without high-signal decisions or conflicts.",
                    requires_approval=False,
                )
            )

        return actions
