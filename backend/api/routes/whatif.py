"""What-If simulation routes — POST /api/v1/whatif"""
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class SimulateRequest(BaseModel):
    decision_id: str
    variable: str
    change_description: str


class CompareRequest(BaseModel):
    decision_id: str
    scenarios: list[dict]   # [{variable, change_description}]


@router.post("/simulate")
async def simulate(body: SimulateRequest, request: Request):
    orch = request.app.state.orchestrator
    result = await orch.run_whatif(body.decision_id, body.variable, body.change_description)
    return result


@router.get("/risk-map/{decision_id}")
async def risk_map(decision_id: str, request: Request):
    orch = request.app.state.orchestrator
    result = await orch._intel.risk_propagation_map(decision_id)
    return result
