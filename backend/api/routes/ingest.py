"""Ingestion routes — POST /api/v1/ingest"""
from fastapi import APIRouter, Request, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from models import SourceType

router = APIRouter()


class IngestTextRequest(BaseModel):
    content: str
    source_type: SourceType = "manual"
    title: str = "Untitled"
    author: Optional[str] = None
    thread_id: Optional[str] = None
    metadata: Optional[dict] = None


class PipelineRequest(BaseModel):
    documents: list[IngestTextRequest]
    query: str = ""
    include_whatif: bool = False
    whatif_variable: str = ""
    whatif_change: str = ""


@router.post("/text")
async def ingest_text(body: IngestTextRequest, request: Request):
    """Ingest a single text document through the full pipeline."""
    orch = request.app.state.orchestrator
    result = await orch.run_full_pipeline(
        raw_documents=[body.model_dump()],
        query="Summarize the key decisions in this document.",
    )
    return {
        "ingested": True,
        "decisions":  result.get("decisions", []),
        "conflicts":  result.get("conflicts", []),
        "answer":     result.get("final_answer", {}),
    }


@router.post("/pipeline")
async def run_pipeline(body: PipelineRequest, request: Request):
    """Run the complete 7-agent pipeline on multiple documents."""
    orch = request.app.state.orchestrator
    result = await orch.run_full_pipeline(
        raw_documents=[d.model_dump() for d in body.documents],
        query=body.query,
        include_whatif=body.include_whatif,
        whatif_variable=body.whatif_variable,
        whatif_change=body.whatif_change,
    )
    return result


@router.post("/file")
async def ingest_file(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(None),
):
    """Ingest an uploaded file (PDF, DOCX)."""
    import tempfile, os
    orch = request.app.state.orchestrator
    suffix = os.path.splitext(file.filename or "file.pdf")[1]
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = await orch._ingest.ingest_file(
            file_path=tmp_path,
            source_type="pdf" if suffix == ".pdf" else "docx",
        )
        return result.data
    finally:
        os.unlink(tmp_path)
