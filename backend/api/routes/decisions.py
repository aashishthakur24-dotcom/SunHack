"""Decisions CRUD — GET /api/v1/decisions"""
from fastapi import APIRouter, Request
router = APIRouter()

@router.get("/")
async def list_decisions(request: Request, top_k: int = 10):
    orch = request.app.state.orchestrator
    hits = await orch._memory.semantic_search("decision", top_k=top_k)
    return {"decisions": hits}
