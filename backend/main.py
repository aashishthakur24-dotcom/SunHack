"""
DecisionDNA — FastAPI Application Entry Point
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from loguru import logger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import get_settings
from orchestrator import AgentOrchestrator
from api.routes import ingest, query, decisions, agents, whatif

cfg = get_settings()

# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

orchestrator: AgentOrchestrator | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestrator
    logger.info("DecisionDNA backend starting...")
    orchestrator = AgentOrchestrator()
    app.state.orchestrator = orchestrator
    yield
    logger.info("Shutting down...")
    if orchestrator:
        orchestrator.shutdown()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DecisionDNA API",
    description="7-Agent Decision Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(ingest.router,    prefix="/api/v1/ingest",    tags=["Ingestion Agent"])
app.include_router(query.router,     prefix="/api/v1/query",     tags=["Query Agent"])
app.include_router(decisions.router, prefix="/api/v1/decisions", tags=["Decisions"])
app.include_router(agents.router,    prefix="/api/v1/agents",    tags=["Agent Status"])
app.include_router(whatif.router,    prefix="/api/v1/whatif",    tags=["Intelligence Agent"])


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "agents": [
            "ingestion", "reasoning", "memory",
            "query", "explainability",
            "conflict_detection", "intelligence"
        ],
        "version": "1.0.0",
    }


@app.get("/api/v1/pipeline/status", tags=["Agent Status"])
async def pipeline_status():
    """Returns mock status of all 7 agents for the frontend pipeline visualization."""
    return {
        "agents": [
            {"id": "ingestion",         "name": "Ingestion Agent",         "status": "ready", "description": "GraphRAG-inspired data ingestion"},
            {"id": "reasoning",         "name": "Reasoning Agent",         "status": "ready", "description": "GPT-4o decision extraction"},
            {"id": "memory",            "name": "Memory Agent",            "status": "ready", "description": "ChromaDB + Neo4j hybrid store"},
            {"id": "query",             "name": "Query Agent",             "status": "ready", "description": "Semantic + relational retrieval"},
            {"id": "explainability",    "name": "Explainability Agent",    "status": "ready", "description": "Transparent RAG answers"},
            {"id": "conflict_detection","name": "Conflict Detection Agent","status": "ready", "description": "NLI contradiction scanning"},
            {"id": "intelligence",      "name": "Intelligence Agent",      "status": "ready", "description": "What-if simulations & impact analysis"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=cfg.app_port, reload=True)
