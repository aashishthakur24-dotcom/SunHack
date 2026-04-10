"""Agent status routes — GET /api/v1/agents"""
from fastapi import APIRouter
router = APIRouter()

AGENT_REGISTRY = [
    {"id": "ingestion",          "name": "Ingestion Agent",         "icon": "database",    "tech": ["GraphRAG", "networkx", "Louvain", "GPT NER"], "description": "Processes Slack, Gmail, and documents into structured knowledge using GraphRAG community detection."},
    {"id": "reasoning",          "name": "Reasoning Agent",         "icon": "brain",       "tech": ["GPT-4o", "Chain-of-Thought", "JSON extraction"], "description": "Extracts what was decided, why, by whom, and where conflicts exist using structured GPT prompting."},
    {"id": "memory",             "name": "Memory Agent",            "icon": "server",      "tech": ["ChromaDB", "Neo4j", "OpenAI Embeddings"], "description": "Stores knowledge in a hybrid system: ChromaDB for semantic search, Neo4j for entity relationships."},
    {"id": "query",              "name": "Query Agent",             "icon": "search",      "tech": ["ChromaDB", "Neo4j", "Shortest Path"], "description": "Retrieves both semantic and relational context for any natural language query."},
    {"id": "explainability",     "name": "Explainability Agent",    "icon": "eye",         "tech": ["RAG", "GPT-4o", "Source Citations", "Confidence Scores"], "description": "Generates transparent answers with reasoning chains, source citations, and confidence scores."},
    {"id": "conflict_detection", "name": "Conflict Detection Agent","icon": "alert-triangle","tech": ["NLI", "Cosine Similarity", "GPT-4o", "Neo4j CONFLICTS_WITH"], "description": "Flags contradictions across data sources using semantic similarity and GPT natural language inference."},
    {"id": "intelligence",       "name": "Intelligence Agent",      "icon": "trending-up",  "tech": ["What-If Simulation", "Risk Propagation", "BFS", "GPT-4o"], "description": "Enables what-if scenario simulations and risk propagation analysis across the decision graph."},
]

@router.get("/")
async def list_agents():
    return {"agents": AGENT_REGISTRY}

@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    agent = next((a for a in AGENT_REGISTRY if a["id"] == agent_id), None)
    if not agent:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
