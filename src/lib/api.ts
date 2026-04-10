/**
 * DecisionDNA — Backend API Client
 * Typed fetch wrapper connecting the frontend to the 7-agent FastAPI backend.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentInfo {
  id: string;
  name: string;
  icon: string;
  tech: string[];
  description: string;
  status?: "ready" | "running" | "done" | "error";
}

export interface IngestionResult {
  ingested: boolean;
  decisions: unknown[];
  conflicts: unknown[];
  answer: ExplainableAnswer;
}

export interface ExplainableAnswer {
  answer: string;
  confidence: number;
  reasoning_chain: string[];
  sources: SourceReference[];
  conflicts: Conflict[];
  graph_path: string[];
}

export interface SourceReference {
  source_id: string;
  source_type: string;
  title: string;
  excerpt: string;
  relevance_score: number;
}

export interface Conflict {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  entity_a: string;
  entity_b: string;
  source_a_id: string;
  source_b_id: string;
  similarity_score: number;
  suggested_resolution: string;
}

export interface WhatIfResult {
  base_decision_id: string;
  variable: string;
  change_description: string;
  narrative_impact: string;
  risk_delta: number;
  affected_nodes: string[];
  confidence: number;
  projected_impact: {
    timeline_change: string;
    cost_impact: string;
    stakeholder_effect: string;
    compliance_risk: string;
  };
}

// ── Agent API ────────────────────────────────────────────────────────────────

export const agentApi = {
  list: () => apiFetch<{ agents: AgentInfo[] }>("/agents/"),
  get:  (id: string) => apiFetch<AgentInfo>(`/agents/${id}`),
  pipelineStatus: () =>
    fetch(`${BASE.replace("/api/v1", "")}/api/v1/pipeline/status`)
      .then(r => r.json()),
};

// ── Ingestion API ─────────────────────────────────────────────────────────────

export const ingestApi = {
  text: (body: {
    content: string;
    source_type?: string;
    title?: string;
    author?: string;
  }) => apiFetch<IngestionResult>("/ingest/text", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  pipeline: (body: {
    documents: Array<{ content: string; source_type: string; title: string }>;
    query?: string;
    include_whatif?: boolean;
    whatif_variable?: string;
    whatif_change?: string;
  }) => apiFetch<unknown>("/ingest/pipeline", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  file: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${BASE}/ingest/file`, { method: "POST", body: fd }).then(r => r.json());
  },
};

// ── Query API ────────────────────────────────────────────────────────────────

export const queryApi = {
  ask: (query: string, top_k = 5) =>
    apiFetch<ExplainableAnswer>("/query/", {
      method: "POST",
      body: JSON.stringify({ query, top_k, include_graph: true }),
    }),

  conflicts: () => apiFetch<{ conflicts: Conflict[]; count: number }>("/query/conflicts"),

  graph: (decision_id: string) =>
    apiFetch<{ nodes: unknown[]; edges: unknown[] }>(`/query/graph/${decision_id}`),
};

// ── What-If API ───────────────────────────────────────────────────────────────

export const whatIfApi = {
  simulate: (body: {
    decision_id: string;
    variable: string;
    change_description: string;
  }) => apiFetch<WhatIfResult>("/whatif/simulate", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  riskMap: (decision_id: string) =>
    apiFetch<unknown>(`/whatif/risk-map/${decision_id}`),
};

// ── Health ────────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () =>
    fetch(`${BASE.replace("/api/v1", "")}/health`)
      .then(r => r.json())
      .catch(() => ({ status: "offline" })),
};
