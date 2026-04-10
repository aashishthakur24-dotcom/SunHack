"""Agentic automation routes — playbooks, runs, and approvals."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from automation import AutomationDocument, AutomationPlaybook
from api.auth import require_supabase_user

router = APIRouter(dependencies=[Depends(require_supabase_user)])


class RunPlaybookRequest(BaseModel):
    documents: Optional[list[AutomationDocument]] = None


class ApprovalRequest(BaseModel):
    approved: bool
    note: str = ""


@router.get("/")
async def list_playbooks(request: Request):
    svc = request.app.state.automation_service
    return {"playbooks": svc.list_playbooks()}


@router.post("/")
async def create_playbook(body: AutomationPlaybook, request: Request):
    svc = request.app.state.automation_service
    created = svc.create_playbook(body)
    return created


@router.get("/{playbook_id}")
async def get_playbook(playbook_id: str, request: Request):
    svc = request.app.state.automation_service
    playbook = svc.get_playbook(playbook_id)
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return playbook


@router.post("/{playbook_id}/run")
async def run_playbook(playbook_id: str, body: RunPlaybookRequest, request: Request):
    svc = request.app.state.automation_service
    run = await svc.run_playbook(playbook_id=playbook_id, documents=body.documents)
    if not run:
        raise HTTPException(status_code=404, detail="Playbook not found or disabled")
    return run


@router.get("/runs/{run_id}")
async def get_run(run_id: str, request: Request):
    svc = request.app.state.automation_service
    run = svc.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/runs/{run_id}/approve")
async def approve_run(run_id: str, body: ApprovalRequest, request: Request):
    svc = request.app.state.automation_service
    run = svc.approve_run(run_id=run_id, approved=body.approved, note=body.note)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found or not awaiting approval")
    return run


@router.post("/webhook/{playbook_id}")
async def trigger_webhook(playbook_id: str, request: Request):
    """Minimal webhook trigger for MVP automation execution."""
    svc = request.app.state.automation_service
    playbook = svc.get_playbook(playbook_id)
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    if playbook.trigger != "webhook":
        raise HTTPException(status_code=400, detail="Playbook is not configured for webhook trigger")
    run = await svc.run_playbook(playbook_id=playbook_id)
    if not run:
        raise HTTPException(status_code=400, detail="Unable to trigger playbook")
    return run
