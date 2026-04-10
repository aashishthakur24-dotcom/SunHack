import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Send, Search, HelpCircle, Users, TrendingUp, AlertTriangle,
  Clock, GitMerge, Zap, ChevronDown, ChevronRight, CheckCircle,
  FileText, Mail, MessageSquare, BookOpen, Shield, Star,
  BarChart2, Eye, Brain, Database, Sparkles, X
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

/* ─── Design tokens ─────────────────────────────────────── */
const GOLD   = "#C9A227";
const GOLD_L = "#F0C040";
const SILVER = "#B8B8B8";
const SILVER_D = "#737373";

/* ─── Role personas ─────────────────────────────────────── */
const ROLES = [
  {
    id: "executive",
    label: "Executive",
    icon: Star,
    color: GOLD,
    title: "C-Suite / Board",
    description: "Strategic decisions, cross-org conflicts, what-if simulations, board-level summaries",
    access: "Full system access — all data, all decisions, historical and real-time",
    suggestedQueries: [
      "Why did we pivot to the APAC market in Q3?",
      "What breaks if we cut the engineering team by 20%?",
      "What conflicts exist between Product and Legal?",
      "Who approved the AWS contract and what was the rationale?",
      "Compare our Q2 and Q4 decisions on vendor selection",
    ],
  },
  {
    id: "manager",
    label: "Manager",
    icon: Users,
    color: SILVER,
    title: "Team Lead / Manager",
    description: "Team-level decisions, stakeholder analysis, sprint conflicts, OKR traceability",
    access: "Department scope — own team decisions + cross-team dependencies",
    suggestedQueries: [
      "Why did we choose React over Vue for the dashboard?",
      "Who are the stakeholders in the authentication redesign?",
      "What decisions were made about the API rate limit last month?",
      "What breaks if we remove the legacy payment gateway?",
      "Show me all decisions made by Sarah's team this quarter",
    ],
  },
  {
    id: "engineer",
    label: "Engineer",
    icon: Brain,
    color: GOLD_L,
    title: "Individual Contributor",
    description: "Feature-level decisions, technical rationale, WHY questions for code decisions",
    access: "Feature scope — system decisions + linked design/arch docs",
    suggestedQueries: [
      "Why do we use Redis instead of Memcached?",
      "What breaks if I change the auth token expiry to 7 days?",
      "When was the GraphQL migration decision made and why?",
      "Who decided we'd use TypeScript and can I see the discussion?",
      "What are the conflicts around the database sharding approach?",
    ],
  },
  {
    id: "legal",
    label: "Legal",
    icon: Shield,
    color: SILVER,
    title: "Legal & Compliance",
    description: "Audit trails, source verification, contradiction detection, regulatory impact",
    access: "Read-only audit access — full provenance, no PII unless cleared",
    suggestedQueries: [
      "Show me all decisions related to GDPR compliance this year",
      "Who approved data retention changes and what was the source?",
      "Are there any conflicts in our data privacy decisions?",
      "What was decided about user data in the EU expansion meeting?",
      "Timeline of all security-related decisions in the last 6 months",
    ],
  },
  {
    id: "onboarding",
    label: "New Hire",
    icon: BookOpen,
    color: GOLD,
    title: "Onboarding / New Employee",
    description: "Company context, institutional memory, 'why do we do X' questions",
    access: "Curated access — public decisions + onboarding knowledge base",
    suggestedQueries: [
      "Why do we use Slack instead of Teams?",
      "What is the history of our product roadmap?",
      "Why did we choose our current cloud provider?",
      "What was the original vision behind DecisionDNA?",
      "Who are the key decision makers I should know about?",
    ],
  },
];

/* ─── Detect query type from text ────────────────────────── */
type QueryType = "rationale" | "attribution" | "whatif" | "conflict" | "timeline" | "compare" | "general";

function detectQueryType(q: string): QueryType {
  const s = q.toLowerCase();
  if (s.includes("conflict") || s.includes("contradict") || s.includes("disagree") || s.includes("clash")) return "conflict";
  if (s.includes("what if") || s.includes("what breaks") || s.includes("breaks if") || s.includes("impact") || s.includes("change")) return "whatif";
  if (s.includes("compare") || s.includes(" vs ") || s.includes("versus") || s.includes("difference between")) return "compare";
  if (s.includes("timeline") || s.includes("history") || s.includes("when") || s.includes("chronolog")) return "timeline";
  if (s.includes("who") || s.includes("decided") || s.includes("approved") || s.includes("stakeholder")) return "attribution";
  if (s.includes("why") || s.includes("reason") || s.includes("rationale") || s.includes("basis")) return "rationale";
  return "general";
}

/* ─── Mock responses keyed by query type ────────────────── */
function buildResponse(query: string, type: QueryType) {
  const responses: Record<QueryType, object> = {
    rationale: {
      answer: `The decision was made based on three primary factors: cost efficiency (37% reduction vs alternatives), existing team expertise (8 of 12 engineers had prior experience), and vendor stability (Gartner Magic Quadrant leader for 3 consecutive years). The discussion originated in a Slack thread (#platform-decisions, March 14) and was formalized in the Architecture Review Board meeting on March 21, attended by the CTO, VP Engineering, and Lead Architect.`,
      confidence: 0.91,
      queryLabel: "RATIONALE",
      queryColor: GOLD,
      sources: [
        { title: "ARB Meeting Notes — March 21", type: "document", relevance: 0.94, excerpt: "After evaluating 4 vendors, the team unanimously agreed to proceed based on cost, expertise and stability scores." },
        { title: "Slack #platform-decisions thread", type: "slack", relevance: 0.87, excerpt: "Really strong case for going with the incumbent — migration overhead alone justifies staying." },
        { title: "Vendor Evaluation Spreadsheet", type: "document", relevance: 0.82, excerpt: "Total 3-year TCO: Incumbent $2.1M vs Challenger $3.4M — 38% savings at current scale." },
        { title: "CTO Email — Final Approval", type: "email", relevance: 0.79, excerpt: "I'm aligned with the ARB recommendation. Let's move forward with the contract renewal." },
      ],
      reasoning: [
        "Semantic search retrieved 4 relevant sources from 3 data streams",
        "Graph path: Slack discussion → ARB Meeting → CTO Approval (3-hop chain)",
        "Cross-referenced vendor evaluation doc for supporting data",
        "Confidence high (0.91) — 4 corroborating sources, 0 conflicts detected",
      ],
      chartType: "donut",
      chartData: {
        label: "Decision Factors",
        items: [
          { name: "Cost Efficiency", value: 37, color: GOLD },
          { name: "Team Expertise", value: 35, color: GOLD_L },
          { name: "Vendor Stability", value: 28, color: SILVER },
        ],
      },
      conflicts: [],
    },
    attribution: {
      answer: `This decision was owned by **Sarah Chen (CTO)** with sponsorship from **Marcus Webb (CEO)**. The primary contributors were the Architecture Review Board (5 members) and the Legal team (reviewed for compliance). The decision chain: Engineering proposal (Mar 8) → ARB review (Mar 14) → Legal sign-off (Mar 18) → CTO approval (Mar 21) → CEO ratification (Mar 22).`,
      confidence: 0.96,
      queryLabel: "ATTRIBUTION",
      queryColor: SILVER,
      sources: [
        { title: "Decision Log — Q1 2025", type: "document", relevance: 0.96, excerpt: "Owner: Sarah Chen (CTO). Sponsors: Marcus Webb. ARB quorum reached: 4/5." },
        { title: "ARB Meeting Notes — March 14", type: "document", relevance: 0.91, excerpt: "Vote: 4 approve, 1 abstain. Motion carries. DRI assigned to VP Engineering." },
        { title: "CTO Approval Email", type: "email", relevance: 0.88, excerpt: "Approved and forwarded to CEO for ratification per governance protocol." },
      ],
      reasoning: [
        "Entity extraction identified 6 named stakeholders across sources",
        "MADE_BY graph edges traced from proposal to ratification",
        "Approval chain reconstructed from 3 document timestamps",
        "Confidence very high (0.96) — decision log is single source of truth",
      ],
      chartType: "bar",
      chartData: {
        label: "Stakeholder Involvement",
        items: [
          { name: "CTO (Sarah Chen)", value: 95, color: GOLD, role: "Decision Owner" },
          { name: "ARB Board", value: 88, color: GOLD_L, role: "Reviewers" },
          { name: "CEO (Marcus Webb)", value: 75, color: SILVER, role: "Ratifier" },
          { name: "Legal Team", value: 60, color: SILVER_D, role: "Compliance Sign-off" },
          { name: "VP Engineering", value: 55, color: SILVER_D, role: "Proposer / DRI" },
        ],
      },
      conflicts: [],
    },
    whatif: {
      answer: `**High Risk Simulation.** If this change is implemented, our model projects a **risk delta of +0.68** (significant increase). Primary impacts: (1) Authentication flows break for ~12% of enterprise SSO integrations, (2) 3 downstream services (Billing, Analytics, Notifications) have hard dependencies on current behavior, (3) Legal compliance flag — GDPR data retention rules link to this parameter. Recommendation: Stage the rollout over 6 weeks with feature flags per customer segment.`,
      confidence: 0.78,
      queryLabel: "WHAT-IF SIM",
      queryColor: GOLD_L,
      sources: [
        { title: "Service Dependency Map v3", type: "document", relevance: 0.92, excerpt: "Billing service calls auth.validateToken() on every transaction — expiry change breaks cache." },
        { title: "SSO Integration Guide", type: "document", relevance: 0.86, excerpt: "Enterprise SSO providers cache SAML assertions for up to the token TTL period." },
        { title: "GDPR Compliance Memo", type: "email", relevance: 0.81, excerpt: "Token expiry is explicitly referenced in our DPA with EU customers — changes require legal review." },
      ],
      reasoning: [
        "What-if simulation run against 3 dependency vectors",
        "Graph BFS traversal: auth_token → Billing (hop 1) → Analytics (hop 2) → Notifications (hop 2)",
        "GDPR flag raised via Conflict Detection Agent on compliance cross-check",
        "Risk delta +0.68 — HIGH. Confidence 0.78 due to incomplete data on mobile clients",
      ],
      chartType: "risk",
      chartData: {
        riskDelta: 0.68,
        affectedNodes: ["Billing Service", "Analytics Pipeline", "Notification Service", "SSO (12% enterprise)", "GDPR Data Retention"],
        impacts: [
          { label: "Enterprise SSO Impact", severity: 82, color: GOLD },
          { label: "Billing Service Risk", severity: 74, color: GOLD_L },
          { label: "Compliance Exposure", severity: 91, color: "#ff6b6b" },
          { label: "Mobile Client Risk", severity: 45, color: SILVER },
        ],
      },
      conflicts: [{ severity: "high", description: "GDPR DPA language conflicts with the proposed change", sourceA: "GDPR Compliance Memo", sourceB: "Proposed Token Policy" }],
    },
    conflict: {
      answer: `**2 active conflicts detected** across 4 sources. Conflict #1 (HIGH): Product roadmap Q4 commits to shipping the data export feature, but the Legal team memo from the same period explicitly prohibits bulk exports until GDPR audit is complete. Conflict #2 (MEDIUM): Engineering estimates 6 weeks for the API migration, but the Sales deck presented to major clients cites a 3-week delivery timeline. These conflicts represent significant institutional risk if unresolved.`,
      confidence: 0.88,
      queryLabel: "CONFLICTS",
      queryColor: "#e85d4a",
      sources: [
        { title: "Q4 Product Roadmap", type: "document", relevance: 0.93, excerpt: "M3 milestone: Data Export shipped to all enterprise tier — committed to board." },
        { title: "Legal Memo — Data Exports", type: "document", relevance: 0.91, excerpt: "GDPR audit must complete before any bulk export capability is enabled. ETA: Q1 2025." },
        { title: "Engineering Sprint Plan", type: "document", relevance: 0.87, excerpt: "API migration estimated: 6 weeks. Requires 3 senior engineers full-time." },
        { title: "Sales Deck — Enterprise Pitch", type: "document", relevance: 0.84, excerpt: "API v3 migration: 3 weeks from contract signature. Tested and ready." },
      ],
      reasoning: [
        "Conflict Detection Agent scanned 47 entity pairs for contradictions",
        "GPT NLI verification confirmed 2 true contradictions (rejected 3 false positives)",
        "CONFLICTS_WITH edges written to Neo4j knowledge graph",
        "Severity HIGH on conflict #1 — board-level commitment vs legal blocker",
      ],
      chartType: "conflict",
      chartData: {
        conflicts: [
          {
            id: 1, severity: "high",
            a: { label: "Product Roadmap Q4", claim: "Data export ships in Q4" },
            b: { label: "Legal Memo", claim: "Bulk exports blocked until GDPR audit (Q1 2025)" },
            resolution: "Escalate to CTO. Either delay feature or expedite legal audit.",
          },
          {
            id: 2, severity: "medium",
            a: { label: "Engineering Estimate", claim: "API migration: 6 weeks" },
            b: { label: "Sales Deck", claim: "API v3 ready in 3 weeks" },
            resolution: "Align on realistic timeline. Sales to be briefed before next client call.",
          },
        ],
      },
      conflicts: [
        { severity: "high", description: "Product roadmap vs Legal export restriction", sourceA: "Q4 Roadmap", sourceB: "Legal Memo" },
        { severity: "medium", description: "Engineering estimate vs Sales promise", sourceA: "Sprint Plan", sourceB: "Sales Deck" },
      ],
    },
    timeline: {
      answer: `Here is the chronological decision chain for this topic. The process began with an initial proposal in Feb 2024, went through 3 review cycles, and was ratified in April 2024. Notable: The original timeline slipped by 3 weeks due to a compliance review cycle. The decision is now implemented and has been operational for 8 months without escalation.`,
      confidence: 0.93,
      queryLabel: "TIMELINE",
      queryColor: SILVER,
      sources: [
        { title: "Initial Proposal — Feb 2024", type: "document", relevance: 0.91, excerpt: "Engineering proposed the new architecture with 3 alternatives evaluated." },
        { title: "ARB Review 1 — Feb 28", type: "document", relevance: 0.88, excerpt: "Approved to proceed with alternative 2. Additional legal review requested." },
        { title: "Legal Sign-off — Mar 18", type: "email", relevance: 0.85, excerpt: "Compliance review complete. No blocking issues identified." },
        { title: "Board Ratification — Apr 3", type: "document", relevance: 0.90, excerpt: "Motion carried 7-0. Implementation authorized from Q2 start." },
      ],
      reasoning: [
        "Timeline reconstructed from 4 timestamped document sources",
        "Date entities extracted and ordered chronologically",
        "3-week delay identified between planned (Mar 25) and actual (Apr 3) ratification",
        "No conflicts in timeline — clean decision chain",
      ],
      chartType: "timeline",
      chartData: {
        events: [
          { date: "Feb 12, 2024", label: "Initial Proposal", type: "proposal", done: true },
          { date: "Feb 28, 2024", label: "ARB Review #1 — Approved", type: "review", done: true },
          { date: "Mar 8, 2024", label: "Legal Review Requested", type: "review", done: true },
          { date: "Mar 18, 2024", label: "Legal Sign-off ✓", type: "approval", done: true },
          { date: "Apr 3, 2024", label: "Board Ratification ✓", type: "approval", done: true },
          { date: "Apr 14, 2024", label: "Implementation Begins", type: "action", done: true },
          { date: "Aug 1, 2024", label: "Operational — No Escalations", type: "milestone", done: true },
        ],
      },
      conflicts: [],
    },
    compare: {
      answer: `Comparing both decisions side by side: The Q2 vendor selection prioritized speed (3-week evaluation cycle) while the Q4 selection prioritized compliance (8-week cycle with legal review). Q2 resulted in a cost savings of $340K; Q4 avoided an estimated $1.2M regulatory risk. Decision quality improved significantly — Q4 had 3x more stakeholder input and a clear DRI vs Q2 which lacked ownership clarity for 2 weeks.`,
      confidence: 0.84,
      queryLabel: "COMPARE",
      queryColor: GOLD_L,
      sources: [
        { title: "Q2 Vendor Decision — Final Report", type: "document", relevance: 0.90, excerpt: "Fast-tracked evaluation. 3 vendors, 3 weeks. Cost was primary decision vector." },
        { title: "Q4 Vendor Decision — Full Report", type: "document", relevance: 0.90, excerpt: "Comprehensive 8-week evaluation. Compliance, cost, stability all weighted equally." },
      ],
      reasoning: [
        "Retrieved both decisions from semantic memory",
        "Extracted comparable attributes: timeline, cost, stakeholders, quality",
        "Side-by-side analysis generated by GPT Reasoning Agent",
        "Confidence 0.84 — Q2 data has gaps (missing stakeholder list)",
      ],
      chartType: "bar",
      chartData: {
        label: "Decision Comparison",
        items: [
          { name: "Stakeholder Coverage", value: 35, value2: 90, color: GOLD, color2: GOLD_L },
          { name: "Process Quality Score", value: 48, value2: 91, color: GOLD, color2: GOLD_L },
          { name: "Risk Mitigation", value: 30, value2: 87, color: GOLD, color2: GOLD_L },
          { name: "Speed", value: 95, value2: 45, color: GOLD, color2: GOLD_L },
        ],
        labels: ["Q2 Decision", "Q4 Decision"],
      },
      conflicts: [],
    },
    general: {
      answer: `Based on the available organizational memory, here is what I found. The information was drawn from emails, Slack conversations, and formal documents spanning the past 18 months. The analysis covers 3 relevant sources with an average relevance score of 0.84. For a more specific answer, try rephrasing your question with "why", "who decided", "what breaks if", or a specific topic focus.`,
      confidence: 0.72,
      queryLabel: "GENERAL",
      queryColor: SILVER,
      sources: [
        { title: "Company Wiki — Process Overview", type: "document", relevance: 0.82, excerpt: "General overview of the decision-making framework and governance structure." },
        { title: "Slack #general — Context", type: "slack", relevance: 0.76, excerpt: "Relevant discussion thread with team input." },
      ],
      reasoning: [
        "General semantic search across full knowledge base",
        "Retrieved top 2 relevant sources by cosine similarity",
        "No specific decision chain identified — broadening search scope",
        "Recommendation: Rephrase with WHY, WHO, WHAT-IF, or CONFLICT keyword",
      ],
      chartType: "donut",
      chartData: {
        label: "Source Distribution",
        items: [
          { name: "Documents", value: 55, color: GOLD },
          { name: "Slack", value: 28, color: SILVER },
          { name: "Email", value: 17, color: GOLD_L },
        ],
      },
      conflicts: [],
    },
  };
  return responses[type] as any;
}

/* ─── Sub-components ─────────────────────────────────────── */

// Confidence ring (SVG donut)
function ConfidenceRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={GOLD} strokeWidth={6}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: "Inter,sans-serif" }}>{(value * 100).toFixed(0)}%</span>
        <span style={{ fontSize: 8, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>conf.</span>
      </div>
    </div>
  );
}

// Source icon
function SourceIcon({ type }: { type: string }) {
  const icons: Record<string, any> = { document: FileText, email: Mail, slack: MessageSquare };
  const Icon = icons[type] || FileText;
  return <Icon style={{ width: 11, height: 11, color: SILVER_D }} />;
}

// Horizontal bar chart
function BarChart({ data }: { data: any }) {
  const isCompare = !!data.labels;
  return (
    <div>
      <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{data.label}</div>
      {isCompare && (
        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
          {data.labels.map((l: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: i === 0 ? GOLD : GOLD_L }} />
              <span style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{l}</span>
            </div>
          ))}
        </div>
      )}
      {data.items.map((item: any, i: number) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif" }}>{item.name}</span>
            {item.role && <span style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{item.role}</span>}
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", background: item.color, borderRadius: 3 }}
            />
          </div>
          {isCompare && (
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginTop: 3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value2}%` }}
                transition={{ delay: i * 0.08 + 0.1, duration: 0.7, ease: "easeOut" }}
                style={{ height: "100%", background: item.color2, borderRadius: 3 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Donut chart (SVG)
function DonutChart({ data }: { data: any }) {
  const total = data.items.reduce((s: number, i: any) => s + i.value, 0);
  let offset = 0;
  const r = 36, circ = 2 * Math.PI * r;
  return (
    <div>
      <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{data.label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width={88} height={88} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          {data.items.map((item: any, i: number) => {
            const frac = item.value / total;
            const dash = frac * circ;
            const gap = circ - dash;
            const el = (
              <circle key={i} cx={44} cy={44} r={r} fill="none"
                stroke={item.color} strokeWidth={14}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset * circ / 100}
                strokeLinecap="butt"
              />
            );
            offset += item.value;
            return el;
          })}
        </svg>
        <div style={{ flex: 1 }}>
          {data.items.map((item: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", flex: 1 }}>{item.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: item.color, fontFamily: "Inter,sans-serif" }}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Risk meter
function RiskMeter({ data }: { data: any }) {
  const delta = data.riskDelta;
  const pct = delta * 100;
  const color = delta > 0.7 ? "#e85d4a" : delta > 0.4 ? GOLD : GOLD_L;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk Delta</span>
        <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "Inter,sans-serif" }}>+{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD_L}, ${color})`, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Affected Systems</div>
      {data.affectedNodes.map((n: string, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "Inter,sans-serif" }}>{n}</span>
        </div>
      ))}
      {data.impacts && (
        <div style={{ marginTop: 10 }}>
          {data.impacts.map((imp: any, i: number) => (
            <div key={i} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{imp.label}</span>
                <span style={{ fontSize: 9, color: imp.color, fontFamily: "Inter,sans-serif", fontWeight: 700 }}>{imp.severity}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${imp.severity}%` }}
                  transition={{ delay: i * 0.1, duration: 0.7 }}
                  style={{ height: "100%", background: imp.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Timeline chart
function TimelineChart({ data }: { data: any }) {
  const typeColors: Record<string, string> = {
    proposal: GOLD_L, review: SILVER, approval: GOLD, action: SILVER, milestone: GOLD,
  };
  return (
    <div>
      <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Decision Timeline</div>
      {data.events.map((ev: any, i: number) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < data.events.length - 1 ? 0 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
              style={{ width: 10, height: 10, borderRadius: "50%", background: typeColors[ev.type], border: `2px solid ${typeColors[ev.type]}40`, flexShrink: 0, marginTop: 3 }} />
            {i < data.events.length - 1 && (
              <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.07)", minHeight: 20 }} />
            )}
          </div>
          <div style={{ paddingBottom: 12 }}>
            <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", marginBottom: 1 }}>{ev.date}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>{ev.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Conflict cards
function ConflictDisplay({ data }: { data: any }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Active Conflicts</div>
      {data.conflicts.map((c: any) => (
        <div key={c.id} style={{ marginBottom: 10, padding: 10, borderRadius: 10, background: "rgba(232,93,74,0.06)", border: `1px solid ${c.severity === "high" ? "rgba(232,93,74,0.3)" : "rgba(201,162,39,0.2)"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: c.severity === "high" ? "#e85d4a" : GOLD, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ⚠ {c.severity}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <div style={{ padding: "6px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 8, color: SILVER_D, fontFamily: "Inter,sans-serif", marginBottom: 2 }}>{c.a.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif" }}>"{c.a.claim}"</div>
            </div>
            <div style={{ padding: "6px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 8, color: SILVER_D, fontFamily: "Inter,sans-serif", marginBottom: 2 }}>{c.b.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif" }}>"{c.b.claim}"</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 5 }}>
            <strong style={{ color: GOLD }}>Resolution:</strong> {c.resolution}
          </div>
        </div>
      ))}
    </div>
  );
}

// Render the right chart based on type
function ChartPanel({ type, data }: { type: string; data: any }) {
  if (type === "donut") return <DonutChart data={data} />;
  if (type === "bar") return <BarChart data={data} />;
  if (type === "risk") return <RiskMeter data={data} />;
  if (type === "timeline") return <TimelineChart data={data} />;
  if (type === "conflict") return <ConflictDisplay data={data} />;
  return null;
}

/* ─── History item type ──────────────────────────────────── */
interface HistoryItem {
  query: string;
  type: QueryType;
  time: string;
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function QueryIntelligencePage() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([
    { query: "Why did we choose Neo4j over TigerGraph?", type: "rationale", time: "2h ago" },
    { query: "Who approved the APAC expansion?", type: "attribution", time: "5h ago" },
    { query: "What breaks if we sunset the v1 API?", type: "whatif", time: "Yesterday" },
  ]);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleQuery = async (q?: string) => {
    const text = q || query;
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setResponse(null);
    setShowReasoning(false);

    const type = detectQueryType(text);
    await new Promise(r => setTimeout(r, 1400 + Math.random() * 600));
    const resp = buildResponse(text, type);
    setResponse({ ...resp, queryType: type, originalQuery: text });
    setHistory(prev => [{ query: text, type, time: "Just now" }, ...prev.slice(0, 6)]);
    setIsLoading(false);
    setQuery("");
  };

  const queryTypeIcon: Record<QueryType, any> = {
    rationale: HelpCircle, attribution: Users, whatif: TrendingUp,
    conflict: AlertTriangle, timeline: Clock, compare: GitMerge, general: Search,
  };

  return (
    <PageLayout title="Query Intelligence" backTo="/dashboard" backLabel="Dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* ─── HEADER ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: "1.75rem 2rem", borderRadius: 20, background: "linear-gradient(135deg, rgba(20,16,8,0.99), rgba(10,9,6,0.99))", border: "1px solid rgba(201,162,39,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 80% at 0% 50%, rgba(201,162,39,0.07), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className="slash-label slash-label-accent">Organizational Memory</span>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, animation: "pulse-dot 1.5s infinite" }} />
                <span style={{ fontSize: 9, color: GOLD, fontFamily: "Inter,sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Live</span>
              </div>
              <h1 className="font-display" style={{ fontSize: "clamp(1.6rem,2.8vw,2.2rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, margin: 0 }}>
                Ask your company's<br />
                <em className="text-gold" style={{ fontStyle: "italic", fontWeight: 300 }}>institutional memory</em>
              </h1>
              <p style={{ fontSize: "0.875rem", color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 6, maxWidth: "38rem" }}>
                Query decisions, rationale, conflicts and impact in plain English — across Slack, Gmail, meetings, and documents.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAccess(v => !v)} className="btn-ghost btn-sm" style={{ fontSize: 11 }}>
                <Shield style={{ width: 11, height: 11 }} /> Who Has Access
              </button>
              <Link to="/agents"><button className="btn-gold btn-sm" style={{ fontSize: 11, padding: "6px 14px" }}><Brain style={{ width: 11, height: 11 }} /> Agent Pipeline</button></Link>
            </div>
          </div>
        </motion.div>

        {/* ─── ACCESS INFO PANEL ─── */}
        <AnimatePresence>
          {showAccess && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ borderRadius: 16, background: "linear-gradient(145deg, rgba(14,12,8,0.98), rgba(8,7,5,0.99))", border: "1px solid rgba(201,162,39,0.12)", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Access Levels & User Personas
                  </h3>
                  <button onClick={() => setShowAccess(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <X style={{ width: 14, height: 14, color: SILVER_D }} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  {ROLES.map(role => {
                    const Icon = role.icon;
                    return (
                      <div key={role.id} style={{ padding: "1rem", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: `1px solid rgba(201,162,39,0.1)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${role.color}12`, border: `1px solid ${role.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon style={{ width: 12, height: 12, color: role.color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif" }}>{role.title}</div>
                            <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{role.label} Role</div>
                          </div>
                        </div>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "Inter,sans-serif", lineHeight: 1.6, margin: "0 0 6px" }}>{role.description}</p>
                        <div style={{ fontSize: 9, color: role.color, fontFamily: "Inter,sans-serif", padding: "3px 8px", borderRadius: 6, background: `${role.color}0a`, border: `1px solid ${role.color}20`, display: "inline-block" }}>{role.access}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ROLE SELECTOR ─── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ROLES.map(role => {
            const Icon = role.icon;
            const active = selectedRole.id === role.id;
            return (
              <motion.button key={role.id} onClick={() => setSelectedRole(role)} whileHover={{ scale: 1.02 }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 12, cursor: "pointer", background: active ? `${role.color}10` : "rgba(255,255,255,0.025)", border: `1px solid ${active ? `${role.color}35` : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}>
                <Icon style={{ width: 13, height: 13, color: active ? role.color : SILVER_D }} />
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? role.color : SILVER_D, fontFamily: "Inter,sans-serif" }}>{role.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* ─── MAIN LAYOUT: input + results left | analytics right ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", alignItems: "start" }}>

          {/* ─── LEFT COLUMN ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Query Input */}
            <div style={{ padding: "1.25rem", borderRadius: 20, background: "linear-gradient(145deg, rgba(16,13,8,0.99), rgba(10,9,6,0.99))", border: "1px solid rgba(201,162,39,0.15)", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.35), transparent)" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
                    placeholder={`Ask ${selectedRole.title} questions... e.g. "${selectedRole.suggestedQueries[0]}"`}
                    style={{
                      width: "100%", background: "transparent", border: "none", outline: "none",
                      color: "#fff", fontSize: 14, fontFamily: "Inter,sans-serif", lineHeight: 1.65,
                      resize: "none", minHeight: 52, boxSizing: "border-box",
                    }}
                    rows={2}
                  />
                </div>
                <button
                  onClick={() => handleQuery()}
                  disabled={isLoading || !query.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
                    background: isLoading || !query.trim() ? "rgba(201,162,39,0.15)" : `linear-gradient(135deg, ${GOLD}, ${GOLD_L})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, alignSelf: "flex-end", transition: "all 0.2s",
                  }}>
                  {isLoading
                    ? <div style={{ width: 16, height: 16, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    : <Send style={{ width: 16, height: 16, color: isLoading || !query.trim() ? SILVER_D : "#000" }} />}
                </button>
              </div>

              {/* Suggested queries */}
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedRole.suggestedQueries.slice(0, 4).map((sq, i) => (
                  <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    onClick={() => handleQuery(sq)}
                    style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(201,162,39,0.15)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "Inter,sans-serif", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = `${GOLD}35`; (e.target as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(201,162,39,0.15)"; (e.target as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}>
                    {sq}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Loading state */}
            <AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ padding: "1.25rem", borderRadius: 16, border: "1px solid rgba(201,162,39,0.12)", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 0.15, 0.3].map((d, i) => (
                        <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.1, delay: d, repeat: Infinity }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>
                      Running 7 agents — ingesting context, reasoning, retrieving sources...
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {["Ingestion", "Reasoning", "Memory Lookup", "Conflict Scan", "Explainability"].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5] }} transition={{ delay: i * 0.25, duration: 0.8 }}
                        style={{ fontSize: 9, color: GOLD, fontFamily: "Inter,sans-serif", padding: "2px 8px", borderRadius: 6, background: `${GOLD}0a`, border: `1px solid ${GOLD}20` }}>
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response */}
            <AnimatePresence>
              {response && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                  {/* Query type badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    {(() => { const Icon = queryTypeIcon[response.queryType as QueryType]; return <Icon style={{ width: 13, height: 13, color: response.queryColor }} />; })()}
                    <span style={{ fontSize: 9, fontWeight: 700, color: response.queryColor, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {response.queryLabel} QUERY
                    </span>
                    <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "2px 8px" }}>
                      "{response.originalQuery.slice(0, 55)}{response.originalQuery.length > 55 ? "..." : ""}"
                    </div>
                    <CheckCircle style={{ width: 12, height: 12, color: GOLD, marginLeft: "auto" }} />
                  </div>

                  {/* Main answer */}
                  <div className="ai-analysis-box" style={{ padding: "1.25rem", marginBottom: "0.75rem" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD_L}60, transparent)` }} />
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: "1rem" }}>
                      <Sparkles style={{ width: 14, height: 14, color: GOLD_L, flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.80)", fontFamily: "Inter,sans-serif", lineHeight: 1.8, margin: 0 }}>
                        {response.answer}
                      </p>
                    </div>

                    {/* Conflict alerts inline */}
                    {response.conflicts?.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {response.conflicts.map((c: any, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(232,93,74,0.08)", border: "1px solid rgba(232,93,74,0.25)" }}>
                            <AlertTriangle style={{ width: 10, height: 10, color: "#e85d4a" }} />
                            <span style={{ fontSize: 10, color: "#e85d4a", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>{c.severity.toUpperCase()} CONFLICT: {c.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Source references */}
                  <div style={{ padding: "1rem 1.25rem", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      Sources · {response.sources.length} retrieved
                    </div>
                    {response.sources.map((src: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <SourceIcon type={src.type} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", fontFamily: "Inter,sans-serif" }}>{src.title}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, fontFamily: "Inter,sans-serif", flexShrink: 0, marginLeft: 8 }}>{(src.relevance * 100).toFixed(0)}%</span>
                          </div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontFamily: "Inter,sans-serif", margin: 0, lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            "{src.excerpt}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reasoning chain (collapsible) */}
                  <div style={{ padding: "0.875rem 1.25rem", borderRadius: 14, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.055)", cursor: "pointer" }}
                    onClick={() => setShowReasoning(v => !v)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Eye style={{ width: 12, height: 12, color: SILVER_D }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Agent Reasoning Chain
                        </span>
                      </div>
                      {showReasoning ? <ChevronDown style={{ width: 12, height: 12, color: SILVER_D }} /> : <ChevronRight style={{ width: 12, height: 12, color: SILVER_D }} />}
                    </div>
                    <AnimatePresence>
                      {showReasoning && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                          <div style={{ paddingTop: 12 }}>
                            {response.reasoning.map((step: string, i: number) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${GOLD}12`, border: `1px solid ${GOLD}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: 8, color: GOLD, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{i + 1}</span>
                                </div>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", lineHeight: 1.55 }}>{step}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!response && !isLoading && (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${GOLD}0a`, border: `1px solid ${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <Search style={{ width: 22, height: 22, color: GOLD }} />
                </div>
                <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400, color: "rgba(255,255,255,0.5)", margin: "0 0 0.5rem" }}>
                  Ask anything about your organization
                </h3>
                <p style={{ fontSize: 13, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>
                  Try "Why did we...", "Who approved...", "What breaks if...", or "Show me conflicts in..."
                </p>
              </div>
            )}
          </div>

          {/* ─── RIGHT COLUMN: Analytics + History ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: 64 }}>

            {/* Analytics viz */}
            <AnimatePresence mode="wait">
              {response ? (
                <motion.div key="chart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ padding: "1.25rem", borderRadius: 18, background: "linear-gradient(145deg, rgba(16,13,8,0.99), rgba(10,9,6,0.99))", border: `1px solid rgba(201,162,39,0.12)`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.3), transparent)" }} />

                  {/* Confidence ring + stats */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <ConfidenceRing value={response.confidence} size={76} />
                    <div>
                      <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>AI Confidence</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}>
                        {response.confidence >= 0.9 ? "Very High — multiple corroborating sources" :
                          response.confidence >= 0.8 ? "High — strong source agreement" :
                            response.confidence >= 0.7 ? "Good — some data gaps remain" : "Moderate — limited source coverage"}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic chart */}
                  <ChartPanel type={response.chartData && response.chartType} data={response.chartData} />
                </motion.div>
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: "1.5rem", borderRadius: 18, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                  <BarChart2 style={{ width: 28, height: 28, color: "rgba(255,255,255,0.12)", margin: "0 auto 0.75rem" }} />
                  <p style={{ fontSize: 11, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>Analytics will appear after you run a query</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Query types guide */}
            <div style={{ padding: "1rem 1.25rem", borderRadius: 18, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.055)" }}>
              <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Query Types</div>
              {[
                { icon: HelpCircle, label: "WHY…", desc: "Decision rationale + sources", color: GOLD },
                { icon: Users, label: "WHO decided…", desc: "Attribution + approval chain", color: SILVER },
                { icon: TrendingUp, label: "WHAT BREAKS IF…", desc: "What-if risk simulation", color: GOLD_L },
                { icon: AlertTriangle, label: "CONFLICTS in…", desc: "Contradiction detection", color: "#e85d4a" },
                { icon: Clock, label: "TIMELINE of…", desc: "Chronological decision chain", color: SILVER },
                { icon: GitMerge, label: "COMPARE…", desc: "Side-by-side decision analysis", color: GOLD_L },
              ].map(({ icon: Icon, label, desc, color }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <Icon style={{ width: 11, height: 11, color, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif" }}>{label} </span>
                    <span style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Query history */}
            <div style={{ padding: "1rem 1.25rem", borderRadius: 18, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.055)" }}>
              <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Recent Queries</div>
              {history.map((h, i) => {
                const Icon = queryTypeIcon[h.type];
                return (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    onClick={() => handleQuery(h.query)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
                    <Icon style={{ width: 10, height: 10, color: SILVER_D, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter,sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 1 }}>{h.query}</div>
                      <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{h.time}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
