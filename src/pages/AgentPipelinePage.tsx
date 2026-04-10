import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Database, Brain, Server, Search, Eye, AlertTriangle, TrendingUp,
  ChevronRight, Play, CheckCircle, Loader, Circle, Zap, ArrowRight,
  Upload, Send, FileText, X
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

/* ── Design constants ── */
const GOLD   = "#C9A227";
const GOLD_L = "#F0C040";
const SILVER = "#B8B8B8";
const SILVER_D = "#737373";

/* ── Agent registry (matches backend) ── */
const AGENTS = [
  {
    id: "ingestion",
    name: "Ingestion Agent",
    shortName: "Ingest",
    icon: Database,
    tech: ["GraphRAG", "networkx", "Louvain", "GPT NER"],
    description: "Processes raw Slack, email, and document data into structured inputs using GraphRAG community detection.",
    detail: "Chunks documents, runs GPT NER, builds entity co-occurrence graph, applies Louvain community detection, and summarises clusters into semantic knowledge units.",
    input: "Raw text / files",
    output: "RawDocument + Entity Graph",
    color: GOLD,
  },
  {
    id: "reasoning",
    name: "Reasoning Agent",
    shortName: "Reason",
    icon: Brain,
    tech: ["GPT-4o", "Chain-of-Thought", "JSON Schema"],
    description: "Extracts decision intelligence — what was decided, why, by whom, and where conflicts exist.",
    detail: "Uses structured GPT-4o prompting with JSON schema enforcement to extract: title, summary, rationale, decision maker, stakeholders, alternatives, constraints, entities, and relationships.",
    input: "RawDocument",
    output: "DecisionIntelligence",
    color: GOLD_L,
  },
  {
    id: "memory",
    name: "Memory Agent",
    shortName: "Memory",
    icon: Server,
    tech: ["ChromaDB", "Neo4j", "OpenAI Embeddings"],
    description: "Stores knowledge in a hybrid system using ChromaDB for semantic search and Neo4j for relationships.",
    detail: "Embeds decisions and entities into ChromaDB vector store (cosine metric). Writes entity nodes, relationship edges, and CONTAINS links into Neo4j graph database for traversal.",
    input: "DecisionIntelligence",
    output: "Hybrid Knowledge Store",
    color: SILVER,
  },
  {
    id: "query",
    name: "Query Agent",
    shortName: "Query",
    icon: Search,
    tech: ["ChromaDB", "Neo4j BFS", "Shortest Path"],
    description: "Retrieves both semantic and relational context when a user asks a question.",
    detail: "Runs parallel retrieval: semantic similarity search in ChromaDB, BFS graph traversal in Neo4j, shortest-path computation between entities, and merges results ranked by relevance score.",
    input: "Natural Language Query",
    output: "Context Bundle",
    color: SILVER,
  },
  {
    id: "explainability",
    name: "Explainability Agent",
    shortName: "Explain",
    icon: Eye,
    tech: ["RAG", "GPT-4o", "Source Citations", "Confidence"],
    description: "Generates transparent answers with supporting sources and confidence scores.",
    detail: "RAG pipeline: injects semantic hits + graph path into GPT-4o with a strict citation-only system prompt. Returns answer, step-by-step reasoning chain, source references, confidence score, and flagged contradictions.",
    input: "Context Bundle + Query",
    output: "ExplainableAnswer",
    color: GOLD_L,
  },
  {
    id: "conflict_detection",
    name: "Conflict Detection Agent",
    shortName: "Conflicts",
    icon: AlertTriangle,
    tech: ["NLI", "Cosine Similarity", "GPT-4o", "Neo4j"],
    description: "Flags contradictions across different data sources using semantic + GPT NLI.",
    detail: "Three-stage pipeline: (1) Find candidate pairs in ChromaDB with suspicious similarity range, (2) GPT NLI verification confirms real contradictions, (3) writes CONFLICTS_WITH edges to Neo4j for graph-based conflict mapping.",
    input: "Entities from all sources",
    output: "Conflict[] + Neo4j edges",
    color: GOLD,
  },
  {
    id: "intelligence",
    name: "Intelligence Agent",
    shortName: "What-If",
    icon: TrendingUp,
    tech: ["What-If Sim", "Risk Propagation", "BFS", "GPT-4o"],
    description: "Enables what-if simulations and impact analysis for better decision-making.",
    detail: "Single scenario: GPT-4o models risk_delta + affected nodes with graph context. Multi-scenario: parallel simulation + GPT comparative analysis with ranking. Risk propagation: BFS decay across Neo4j decision graph.",
    input: "DecisionIntelligence + Variable",
    output: "WhatIfScenario + Risk Map",
    color: GOLD_L,
  },
];

type RunStatus = "idle" | "running" | "done" | "error";
interface AgentRun { agentId: string; status: RunStatus; ms?: number }

/* ── Agent card component ── */
function AgentCard({
  agent,
  index,
  isActive,
  run,
  onClick,
}: {
  agent: typeof AGENTS[0];
  index: number;
  isActive: boolean;
  run?: AgentRun;
  onClick: () => void;
}) {
  const Icon = agent.icon;
  const statusIcon = {
    idle:    <Circle style={{ width: 10, height: 10, color: SILVER_D }} />,
    running: <Loader style={{ width: 10, height: 10, color: GOLD_L, animation: "spin 1s linear infinite" }} />,
    done:    <CheckCircle style={{ width: 10, height: 10, color: GOLD }} />,
    error:   <X style={{ width: 10, height: 10, color: "#888" }} />,
  }[run?.status ?? "idle"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onClick={onClick}
      style={{
        position: "relative",
        background: isActive
          ? `linear-gradient(135deg, rgba(201,162,39,0.1) 0%, rgba(10,9,7,0.98) 100%)`
          : "linear-gradient(145deg, rgba(14,12,8,0.98), rgba(8,7,5,0.99))",
        border: `1px solid ${isActive ? `${GOLD}40` : "rgba(201,162,39,0.1)"}`,
        borderRadius: 16,
        padding: "1.1rem",
        cursor: "pointer",
        transition: "all 0.25s ease",
        overflow: "hidden",
      }}
      whileHover={{ borderColor: `${GOLD}30`, scale: 1.01 }}
    >
      {/* Top shimmer on active */}
      {isActive && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${agent.color}80, transparent)` }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Icon */}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${agent.color}12`, border: `1px solid ${agent.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 16, height: 16, color: agent.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#fff" : "rgba(255,255,255,0.75)", fontFamily: "Inter,sans-serif" }}>
                {agent.name}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {run && <span style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{run.ms ? `${run.ms.toFixed(0)}ms` : ""}</span>}
              {statusIcon}
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", fontFamily: "Inter,sans-serif", lineHeight: 1.6, margin: "0 0 8px" }}>
            {agent.description}
          </p>

          {/* Tech tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {agent.tech.map((t, i) => (
              <span key={i} style={{ padding: "1px 7px", borderRadius: 6, background: `${agent.color}08`, border: `1px solid ${agent.color}20`, fontSize: 9, color: agent.color, fontFamily: "Inter,sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* IO row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: 6, maxWidth: "40%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.input}</span>
        <ArrowRight style={{ width: 10, height: 10, color: SILVER_D, flexShrink: 0 }} />
        <span style={{ fontSize: 9, color: GOLD, fontFamily: "Inter,sans-serif", background: `${GOLD}0a`, border: `1px solid ${GOLD}20`, padding: "2px 7px", borderRadius: 6 }}>{agent.output}</span>
      </div>
    </motion.div>
  );
}

/* ── Demo runner ── */
async function runDemo(
  text: string,
  onUpdate: (agentId: string, status: RunStatus, ms?: number) => void,
): Promise<void> {
  const delays = [800, 1200, 700, 600, 1100, 900, 800];
  for (let i = 0; i < AGENTS.length; i++) {
    const agent = AGENTS[i];
    onUpdate(agent.id, "running");
    await new Promise(r => setTimeout(r, delays[i]));
    onUpdate(agent.id, "done", delays[i]);
  }
}

/* ── Main page ── */
export default function AgentPipelinePage() {
  const [activeAgent, setActiveAgent] = useState<string>(AGENTS[0].id);
  const [runs, setRuns] = useState<Record<string, AgentRun>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<null | {
    answer: string;
    confidence: number;
    reasoning_chain: string[];
    sources: Array<{ title: string; relevance_score: number }>;
  }>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeAgentData = AGENTS.find(a => a.id === activeAgent)!;

  // Check backend health
  useEffect(() => {
    fetch("http://localhost:8080/health")
      .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRuns({});
    setResult(null);

    const text = inputText || "The board has approved the Q4 APAC expansion. However, the legal team flagged a compliance concern that conflicts with the timeline. The CFO noted that revenue projections support the move, but risk assessment recommends a 6-month delay.";

    await runDemo(text, (agentId, status, ms) => {
      setRuns(prev => ({ ...prev, [agentId]: { agentId, status, ms } }));
      setActiveAgent(agentId);
    });

    // Mock result for demo
    setResult({
      answer: "The APAC expansion decision has a conflict between the Board Approval (greenlit Q4) and the Risk Assessment (recommends 6-month delay due to compliance). Revenue data (CFO) supports the expansion. Recommend resolving the compliance review first before committing to the Q4 timeline.",
      confidence: 0.87,
      reasoning_chain: [
        "Retrieved 3 relevant sources via semantic search",
        "Graph path: Board Approval → CONFLICTS_WITH → Risk Assessment",
        "CFO projection SUPPORTS Board Approval",
        "Compliance review is incomplete — creates blocker",
        "Confidence adjusted down due to 1 unresolved conflict",
      ],
      sources: [
        { title: "Board Approval Memo", relevance_score: 0.94 },
        { title: "Risk Assessment v2", relevance_score: 0.89 },
        { title: "CFO Revenue Projection", relevance_score: 0.76 },
      ],
    });

    setIsRunning(false);
  };

  return (
    <PageLayout title="Agent Pipeline" backTo="/" backLabel="Home">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: "relative", overflow: "hidden", padding: "2rem", borderRadius: 20, background: "linear-gradient(135deg, rgba(20,16,8,0.99), rgba(10,9,6,0.99))", border: "1px solid rgba(201,162,39,0.15)" }}
        >
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 80% at 5% 50%, rgba(201,162,39,0.06), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)" }} />
          
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="slash-label slash-label-accent">7-Agent AI System</span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 20,
                  background: backendOnline === null ? "rgba(255,255,255,0.05)" : backendOnline ? `${GOLD}0d` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${backendOnline === null ? "rgba(255,255,255,0.1)" : backendOnline ? `${GOLD}25` : "rgba(255,255,255,0.1)"}`,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: backendOnline === null ? SILVER_D : backendOnline ? GOLD : SILVER_D, animation: backendOnline ? "pulse-dot 1.5s infinite" : "none" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: backendOnline ? GOLD : SILVER_D, fontFamily: "Inter,sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {backendOnline === null ? "Checking..." : backendOnline ? "Backend Online" : "Demo Mode"}
                  </span>
                </div>
              </div>
              <h1 className="font-display" style={{ fontSize: "clamp(1.75rem,3vw,2.4rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, margin: 0 }}>
                The Decision Intelligence<br />
                <em className="text-gold" style={{ fontStyle: "italic", fontWeight: 300 }}>Agent Pipeline</em>
              </h1>
              <p style={{ fontSize: "0.9375rem", color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 8, maxWidth: "38rem" }}>
                A LangGraph-orchestrated system of 7 specialized agents — from GraphRAG ingestion to what-if simulation — transforming raw data into explainable decision intelligence.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
              <Link to="/insights"><button className="btn-ghost btn-sm" style={{ fontSize: 12 }}>AI Insights</button></Link>
              <Link to="/canvas"><button className="btn-gold btn-sm" style={{ padding: "6px 16px", fontSize: 12 }}><Zap style={{ width: 12, height: 12 }} /> Open Canvas</button></Link>
            </div>
          </div>
        </motion.div>

        {/* ── MAIN GRID: agents left, detail right ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "1rem" }}>

          {/* LEFT — 7 agent cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {AGENTS.map((agent, index) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={index}
                isActive={activeAgent === agent.id}
                run={runs[agent.id]}
                onClick={() => setActiveAgent(agent.id)}
              />
            ))}

            {/* Connector line */}
            <div style={{ display: "flex", justifyContent: "center", margin: "0.25rem 0" }}>
              <div style={{ width: 1, height: 24, background: `linear-gradient(to bottom, ${GOLD}40, transparent)` }} />
            </div>
          </div>

          {/* RIGHT — detail panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: 64, alignSelf: "flex-start" }}>

            {/* Agent detail */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                style={{ padding: "1.25rem", borderRadius: 20, background: "linear-gradient(145deg, rgba(18,14,9,0.98), rgba(10,9,6,0.99))", border: `1px solid ${activeAgentData.color}25`, position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 60% at 90% 10%, ${activeAgentData.color}06, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${activeAgentData.color}60, transparent)` }} />

                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                    {(() => { const Icon = activeAgentData.icon; return <div style={{ width: 40, height: 40, borderRadius: 11, background: `${activeAgentData.color}14`, border: `1px solid ${activeAgentData.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon style={{ width: 18, height: 18, color: activeAgentData.color }} /></div>; })()}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Agent {String(AGENTS.findIndex(a => a.id === activeAgent) + 1).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif" }}>{activeAgentData.name}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "Inter,sans-serif", lineHeight: 1.75, marginBottom: "1rem" }}>
                    {activeAgentData.detail}
                  </p>

                  {/* IO */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
                    <div style={{ padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Input</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>{activeAgentData.input}</div>
                    </div>
                    <div style={{ padding: "10px", borderRadius: 10, background: `${activeAgentData.color}08`, border: `1px solid ${activeAgentData.color}20` }}>
                      <div style={{ fontSize: 9, color: activeAgentData.color, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Output</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>{activeAgentData.output}</div>
                    </div>
                  </div>

                  {/* Tech stack */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Tech Stack</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {activeAgentData.tech.map((t, i) => (
                        <span key={i} style={{ padding: "3px 9px", borderRadius: 7, background: `${activeAgentData.color}10`, border: `1px solid ${activeAgentData.color}25`, fontSize: 10, color: activeAgentData.color, fontFamily: "Inter,sans-serif", fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Run status */}
                  {runs[activeAgent] && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: runs[activeAgent].status === "done" ? `${GOLD}0a` : "rgba(255,255,255,0.03)", border: `1px solid ${runs[activeAgent].status === "done" ? `${GOLD}30` : "rgba(255,255,255,0.06)"}` }}>
                      {runs[activeAgent].status === "running"
                        ? <Loader style={{ width: 12, height: 12, color: GOLD_L, animation: "spin 1s linear infinite" }} />
                        : <CheckCircle style={{ width: 12, height: 12, color: GOLD }} />}
                      <span style={{ fontSize: 11, color: runs[activeAgent].status === "done" ? GOLD : "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>
                        {runs[activeAgent].status === "running" ? "Processing..." : `Completed in ${runs[activeAgent].ms?.toFixed(0)}ms`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ── Demo Runner ── */}
            <div style={{ padding: "1.25rem", borderRadius: 20, background: "linear-gradient(145deg, rgba(14,12,8,0.98), rgba(8,7,5,0.99))", border: "1px solid rgba(201,162,39,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                <Play style={{ width: 14, height: 14, color: GOLD }} />
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Run Pipeline Demo</h3>
              </div>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste a document, email, or decision summary to run through all 7 agents..."
                style={{
                  width: "100%", minHeight: 80, background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(201,162,39,0.15)", borderRadius: 12,
                  padding: "10px 12px", color: "#fff", fontSize: 12,
                  fontFamily: "Inter,sans-serif", resize: "vertical", outline: "none",
                  lineHeight: 1.6, boxSizing: "border-box", marginBottom: 10,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}40`; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.15)"; }}
              />

              <button
                onClick={handleRun}
                disabled={isRunning}
                className="btn-gold"
                style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, opacity: isRunning ? 0.7 : 1 }}
              >
                {isRunning
                  ? <><Loader style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> Running Pipeline...</>
                  : <><Play style={{ width: 13, height: 13 }} /> Run All 7 Agents</>}
              </button>
            </div>

            {/* ── Result ── */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="ai-analysis-box"
                  style={{ padding: "1.25rem" }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD_L}60, transparent)` }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.875rem" }}>
                    <Zap style={{ width: 14, height: 14, color: GOLD_L }} />
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pipeline Result</h4>
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: GOLD_L, fontFamily: "Inter,sans-serif" }}>{(result.confidence * 100).toFixed(0)}% confidence</span>
                  </div>

                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", lineHeight: 1.75, marginBottom: "1rem" }}>{result.answer}</p>

                  {/* Reasoning chain */}
                  <div style={{ marginBottom: "0.875rem" }}>
                    <div style={{ fontSize: 9, color: SILVER_D, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Reasoning Chain</div>
                    {result.reasoning_chain.map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${GOLD}12`, border: `1px solid ${GOLD}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 8, color: GOLD, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{i + 1}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sources */}
                  <div>
                    <div style={{ fontSize: 9, color: SILVER_D, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter,sans-serif", marginBottom: 6 }}>Sources</div>
                    {result.sources.map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < result.sources.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter,sans-serif" }}>{s.title}</span>
                        <span style={{ fontSize: 10, color: GOLD, fontFamily: "Inter,sans-serif", fontWeight: 700 }}>{(s.relevance_score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Architecture flow diagram ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ padding: "2rem", borderRadius: 20, background: "linear-gradient(145deg, rgba(14,12,8,0.98), rgba(8,7,5,0.99))", border: "1px solid rgba(201,162,39,0.1)" }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 className="font-display" style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", margin: 0 }}>
              Agent Architecture
            </h2>
            <p style={{ fontSize: 13, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 6 }}>
              LangGraph StateGraph — directed pipeline with conditional what-if branch
            </p>
          </div>

          {/* Pipeline flow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              const isDone = !!runs[agent.id];
              return (
                <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <motion.div
                    animate={isDone ? { borderColor: `${agent.color}60`, background: `${agent.color}10` } : {}}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 16px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: `1px solid rgba(201,162,39,0.1)`, cursor: "pointer", minWidth: 80 }}
                    onClick={() => setActiveAgent(agent.id)}
                  >
                    <Icon style={{ width: 18, height: 18, color: isDone ? agent.color : SILVER_D }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: isDone ? agent.color : SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>{agent.shortName}</span>
                    {runs[agent.id]?.status === "done" && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
                    )}
                  </motion.div>
                  {i < AGENTS.length - 1 && (
                    <ChevronRight style={{ width: 14, height: 14, color: isDone ? GOLD : "rgba(255,255,255,0.12)", flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Backend stack */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginTop: "1.5rem" }}>
            {[
              { label: "Orchestration", tech: "LangGraph StateGraph", sub: "7-node directed graph" },
              { label: "Vector Store", tech: "ChromaDB", sub: "Cosine similarity search" },
              { label: "Graph DB", tech: "Neo4j 5.x", sub: "APOC + GDS plugins" },
              { label: "LLM", tech: "GPT-4o", sub: "OpenAI / structured output" },
            ].map((item, i) => (
              <div key={i} style={{ padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,162,39,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: SILVER_D, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: "Inter,sans-serif" }}>{item.tech}</div>
                <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
