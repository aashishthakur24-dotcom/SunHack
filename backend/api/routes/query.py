"""Query + Explainability routes — POST /api/v1/query"""
from fastapi import APIRouter, Request
from models import QueryRequest

router = APIRouter()


@router.post("/")
async def query(body: QueryRequest, request: Request):
    """Query existing memory — runs Query Agent + Explainability Agent."""
    orch = request.app.state.orchestrator
    result = await orch.run_query_only(body.query)
    return result


@router.get("/conflicts")
async def get_all_conflicts(request: Request):
    """Return all detected conflicts from Neo4j."""
    orch = request.app.state.orchestrator
    conflicts = orch._neo4j.get_all_conflicts()
    return {"conflicts": conflicts, "count": len(conflicts)}


@router.get("/graph/{decision_id}")
async def get_decision_graph(decision_id: str, request: Request):
    """Return the full Neo4j graph for a decision."""
    orch = request.app.state.orchestrator
    graph = orch._neo4j.get_decision_graph(decision_id)
    return graph
