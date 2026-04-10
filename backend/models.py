"""
DecisionDNA — Core Data Models
Shared Pydantic schemas used by all agents.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field
import uuid


# ── Source types ────────────────────────────────────────────────────────────

SourceType = Literal["gmail", "slack", "google_docs", "google_drive", "pdf", "docx", "url", "manual"]
NodeType    = Literal["decision", "stakeholder", "fact", "conflict", "hypothesis", "action"]
AgentName   = Literal[
    "ingestion", "reasoning", "memory", "query",
    "explainability", "conflict_detection", "intelligence"
]


# ── Raw ingested document ────────────────────────────────────────────────────

class RawDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_type: SourceType
    title: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    author: Optional[str] = None
    thread_id: Optional[str] = None


# ── Extracted entity / relationship ─────────────────────────────────────────

class Entity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: NodeType
    label: str
    description: str = ""
    confidence: float = 1.0
    source_ids: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Relationship(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_entity_id: str
    target_entity_id: str
    relation: str          # e.g. "SUPPORTS", "CONFLICTS_WITH", "MADE_BY", "LEADS_TO"
    weight: float = 1.0
    confidence: float = 1.0
    evidence: str = ""


# ── Decision intelligence output from Reasoning Agent ───────────────────────

class DecisionIntelligence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    rationale: str
    decision_maker: Optional[str] = None
    stakeholders: list[str] = Field(default_factory=list)
    alternatives_considered: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    source_ids: list[str] = Field(default_factory=list)
    entities: list[Entity] = Field(default_factory=list)
    relationships: list[Relationship] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Conflict ─────────────────────────────────────────────────────────────────

class Conflict(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    severity: Literal["low", "medium", "high", "critical"]
    description: str
    entity_a: str
    entity_b: str
    source_a_id: str
    source_b_id: str
    similarity_score: float         # cosine distance in semantic space
    suggested_resolution: str = ""
    detected_at: datetime = Field(default_factory=datetime.utcnow)


# ── Query / Answer ────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    decision_ids: list[str] = Field(default_factory=list)   # scope to specific decisions
    top_k: int = 5
    include_graph: bool = True


class SourceReference(BaseModel):
    source_id: str
    source_type: SourceType
    title: str
    excerpt: str
    relevance_score: float


class ExplainableAnswer(BaseModel):
    answer: str
    confidence: float
    reasoning_chain: list[str]        # step-by-step reasoning trace
    sources: list[SourceReference]
    conflicts: list[Conflict] = Field(default_factory=list)
    graph_path: list[str] = Field(default_factory=list)   # Neo4j path traversed


# ── What-If simulation ──────────────────────────────────────────────────────

class WhatIfScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    base_decision_id: str
    variable: str               # Which variable changes
    change_description: str
    projected_impact: dict[str, Any] = Field(default_factory=dict)
    risk_delta: float = 0.0     # Change in overall risk score
    affected_nodes: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Agent result wrapper ─────────────────────────────────────────────────────

class AgentResult(BaseModel):
    agent: AgentName
    success: bool
    duration_ms: float
    data: Any
    error: Optional[str] = None
    tokens_used: int = 0
