import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import {
  GitBranch, Zap, Shield, BarChart3, FileText, Mail,
  Video, TrendingUp, Plus, ArrowRight, Clock, Search,
  Activity, RefreshCw, Star, ChevronRight, Sparkles,
  AlertOctagon, CheckCircle2, Circle
} from "lucide-react";

/* ── Design constants ── */
const GOLD   = "#C9A227";
const GOLD_L = "#F0C040";
const SILVER = "#B8B8B8";
const SILVER_D = "#737373";

/* ── Data ── */
const stats = [
  { label: "Decisions Made",     value: "142",  delta: "+12 this week", icon: GitBranch, trend: "+9%" },
  { label: "Conflicts Resolved", value: "38",   delta: "+5 today",      icon: Shield,    trend: "+15%" },
  { label: "Sources Ingested",   value: "2.4k", delta: "+340 this week", icon: FileText,  trend: "+22%" },
  { label: "Avg Confidence",     value: "87%",  delta: "↑ from 79%",    icon: Star,      trend: "+8%" },
];

const recentDecisions = [
  { title: "APAC Market Entry Q4",      status: "in-progress", conflicts: 2, sources: 5,  time: "2h ago",  confidence: 87 },
  { title: "Vendor Contract Renewal",   status: "complete",    conflicts: 0, sources: 3,  time: "5h ago",  confidence: 94 },
  { title: "Engineering Headcount H2",  status: "conflict",    conflicts: 3, sources: 8,  time: "1d ago",  confidence: 61 },
  { title: "Product Roadmap 2026",      status: "in-progress", conflicts: 1, sources: 12, time: "2d ago",  confidence: 78 },
  { title: "Office Lease Expansion",    status: "complete",    conflicts: 0, sources: 2,  time: "3d ago",  confidence: 92 },
];

const integrations = [
  { name: "Gmail",       icon: Mail,     connected: true,  lastSync: "2 min ago" },
  { name: "Google Meet", icon: Video,    connected: true,  lastSync: "1h ago"    },
  { name: "Google Docs", icon: FileText, connected: false, lastSync: "Never"     },
];

const aiInsights = [
  {
    id: 1, type: "conflict",
    heading: "Timeline Contradiction Detected",
    body: "Board Memo (p.3) approves Q4 launch while Risk Assessment (p.7) mandates 6-month compliance review. Resolution required before decision is finalized.",
    sources: ["Board Memo", "Risk Assessment v2"],
    confidence: 94,
    action: "View Conflict",
  },
  {
    id: 2, type: "insight",
    heading: "Revenue Projection Alignment",
    body: "3 independent sources (Q3 Report, CFO Email, Analyst Brief) are in agreement on the $2.4M revenue target. High confidence for this branch of the decision tree.",
    sources: ["Q3 Revenue Report", "CFO Email", "Analyst Brief"],
    confidence: 91,
    action: "Map to Canvas",
  },
  {
    id: 3, type: "action",
    heading: "Pending Stakeholder Input",
    body: "Legal Team's compliance review was last referenced 3h ago but marked incomplete. This creates a blocker on 2 downstream decision nodes.",
    sources: ["Legal Team Email", "Compliance Doc"],
    confidence: 78,
    action: "Request Update",
  },
];

const liveActivity = [
  { text: "Gmail: APAC risk thread flagged",         time: "2m",  type: "conflict" },
  { text: "Conflict resolved — Vendor Contract",     time: "14m", type: "resolved" },
  { text: "Meet transcript: 3 nodes auto-generated", time: "1h",  type: "insight"  },
  { text: "Board_Memo_Q3.pdf ingested (14 entities)","time": "2h",  type: "source"  },
  { text: "Confidence score updated: 87% → 94%",    time: "3h",  type: "insight"  },
];

const SL: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  "complete":    { color: SILVER,   label: "Complete",     icon: CheckCircle2 },
  "in-progress": { color: GOLD,     label: "In Progress",  icon: Circle       },
  "conflict":    { color: GOLD_L,   label: "Has Conflicts",icon: AlertOctagon },
};

const AT: Record<string, string> = {
  conflict: GOLD, resolved: SILVER, insight: GOLD_L, source: SILVER_D,
};

/* ── Card shell ── */
function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(145deg, rgba(20,18,13,0.98), rgba(11,10,8,0.99))",
        border: "1px solid rgba(201,162,39,0.12)",
        borderRadius: 20,
        padding: "1.25rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Confidence ring ── */
function ConfidenceRing({ value, size = 36 }: { value: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 85 ? GOLD_L : value >= 70 ? GOLD : SILVER;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 1s ease" }} />
    </svg>
  );
}

/* ── AI Insight Card ── */
function AIInsightCard({ insight, delay }: { insight: typeof aiInsights[0]; delay: number }) {
  const iColor = insight.type === "conflict" ? GOLD : insight.type === "action" ? GOLD_L : SILVER;
  const iIcon = insight.type === "conflict" ? AlertOctagon : insight.type === "action" ? Zap : CheckCircle2;
  const IIcon = iIcon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="ai-analysis-box"
      style={{ padding: "1.25rem", marginBottom: "1rem", cursor: "pointer", transition: "transform 0.2s" }}
      whileHover={{ scale: 1.012 }}
    >
      {/* Gold shimmer streak */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${iColor}60, transparent)` }} />

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iColor}12`, border: `1px solid ${iColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IIcon style={{ width: 16, height: 16, color: iColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", lineHeight: 1.3, margin: 0 }}>{insight.heading}</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <ConfidenceRing value={insight.confidence} size={28} />
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD_L, fontFamily: "Inter, sans-serif" }}>{insight.confidence}%</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif", lineHeight: 1.7, margin: "0 0 10px" }}>{insight.body}</p>

          {/* Sources */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {insight.sources.map((s, i) => (
              <span key={i} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(201,162,39,0.07)", border: "1px solid rgba(201,162,39,0.18)", fontSize: 10, color: GOLD, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>{s}</span>
            ))}
          </div>

          <button style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: GOLD_L, fontFamily: "Inter, sans-serif", fontWeight: 700, background: "transparent", border: `1px solid ${GOLD}30`, borderRadius: 20, padding: "4px 12px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; (e.currentTarget as HTMLButtonElement).style.background = `${GOLD}10`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${GOLD}30`; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            {insight.action} <ChevronRight style={{ width: 10, height: 10 }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Good morning");
  const [activeInsight, setActiveInsight] = useState(0);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Auto-cycle insights badge
  useEffect(() => {
    const t = setInterval(() => setActiveInsight(i => (i + 1) % aiInsights.length), 4000);
    return () => clearInterval(t);
  }, []);

  const itemV = {
    hidden: { opacity: 0, y: 18 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }),
  };

  return (
    <PageLayout
      title="Dashboard"
      backTo="/"
      backLabel="Home"
      actions={
        <Link to="/canvas">
          <button className="btn-gold btn-sm" style={{ padding: "6px 16px", fontSize: 12 }}>
            <Plus style={{ width: 12, height: 12 }} /> New Decision
          </button>
        </Link>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── GREETING + SUMMARY HERO ── */}
        <motion.div custom={0} variants={itemV} initial="hidden" animate="visible"
          style={{ position: "relative", overflow: "hidden", padding: "2rem 2rem", borderRadius: 20, background: "linear-gradient(135deg, rgba(20,16,8,0.98) 0%, rgba(10,9,7,0.99) 100%)", border: "1px solid rgba(201,162,39,0.15)" }}>
          {/* Gold shimmer */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 70% at 10% 50%, rgba(201,162,39,0.06), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)" }} />

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <h1 className="font-display" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, margin: 0 }}>
                {greeting}, Sam.
              </h1>
              <p style={{ fontSize: "0.9375rem", color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 6, margin: "6px 0 0" }}>
                You have <span style={{ color: GOLD_L, fontWeight: 600 }}>2 decisions</span> needing attention and <span style={{ color: GOLD, fontWeight: 600 }}>3 active conflicts</span>.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/canvas" style={{ textDecoration: "none" }}>
                <button className="btn-ghost btn-sm" style={{ fontSize: 12, padding: "6px 14px" }}>
                  <GitBranch style={{ width: 12, height: 12 }} /> Open Canvas
                </button>
              </Link>
              <Link to="/query" style={{ textDecoration: "none" }}>
                <button className="btn-ghost btn-sm" style={{ fontSize: 12, padding: "6px 14px", borderColor: "rgba(201,162,39,0.25)", color: "rgba(255,255,255,0.75)" }}>
                  <Search style={{ width: 12, height: 12 }} /> Ask AI
                </button>
              </Link>
              <Link to="/insights" style={{ textDecoration: "none" }}>
                <button className="btn-gold btn-sm" style={{ padding: "6px 16px", fontSize: 12 }}>
                  <Sparkles style={{ width: 12, height: 12 }} /> AI Insights
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── STATS GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} custom={i + 1} variants={itemV} initial="hidden" animate="visible">
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${GOLD}10`, border: `1px solid ${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 14, height: 14, color: GOLD }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: SILVER_D, fontFamily: "Inter,sans-serif", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 20 }}>{s.trend}</span>
                  </div>
                  <div className="font-display" style={{ fontSize: "2rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: GOLD, fontFamily: "Inter,sans-serif", marginTop: 3 }}>{s.delta}</div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ── MAIN GRID: left (decisions+activity) | right (AI analysis) ── */}
        <motion.div custom={5} variants={itemV} initial="hidden" animate="visible"
          style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1rem" }}>

          {/* LEFT COL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Recent Decisions */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase" }}>Recent Decisions</h2>
                <Link to="/canvas" style={{ fontSize: 11, color: GOLD, fontFamily: "Inter,sans-serif", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>View all <ChevronRight style={{ width: 11, height: 11 }} /></Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {recentDecisions.map((d, i) => {
                  const status = SL[d.status];
                  const StatusIcon = status.icon;
                  return (
                    <motion.div key={i}
                      whileHover={{ background: "rgba(201,162,39,0.03)", borderRadius: 10 }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}>
                      <StatusIcon style={{ width: 14, height: 14, color: status.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", fontFamily: "Inter,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                        <div style={{ fontSize: 11, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 2 }}>
                          {d.sources} sources · {d.time}
                          {d.conflicts > 0 && <span style={{ color: GOLD, marginLeft: 8, fontWeight: 600 }}>⚠ {d.conflicts} conflict{d.conflicts > 1 ? "s" : ""}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <ConfidenceRing value={d.confidence} size={32} />
                        <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 2 }}>{d.confidence}%</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* Bottom row: Integrations + Live Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Integrations */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Connected Apps</h3>
                  <Link to="/settings" style={{ fontSize: 10, color: GOLD, fontFamily: "Inter,sans-serif", textDecoration: "none", fontWeight: 600 }}>Manage</Link>
                </div>
                {integrations.map((intg, i) => {
                  const Icon = intg.icon;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < integrations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${GOLD}0d`, border: `1px solid ${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 13, height: 13, color: SILVER }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif" }}>{intg.name}</div>
                        <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif" }}>{intg.lastSync}</div>
                      </div>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: intg.connected ? GOLD : "rgba(255,255,255,0.12)", boxShadow: intg.connected ? `0 0 6px ${GOLD}80` : "none" }} />
                    </div>
                  );
                })}
              </Card>

              {/* Live Activity */}
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.875rem" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}`, animation: "pulse-dot 2s infinite" }} />
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Activity</h3>
                </div>
                {liveActivity.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: i < liveActivity.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: AT[a.type], marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}>{a.text}</div>
                      <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 1 }}>{a.time} ago</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {/* RIGHT COL — AI Analysis Panel */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: 15, height: 15, color: GOLD_L }} />
              </div>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Analysis</h2>
                <p style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter,sans-serif", margin: 0 }}>3 insights · Updated now</p>
              </div>
              {/* Live pulse */}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: `${GOLD}0d`, border: `1px solid ${GOLD}20` }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD_L, animation: "pulse-dot 1.5s infinite" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, fontFamily: "Inter,sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live</span>
              </div>
            </div>

            {/* AI Insight Cards */}
            {aiInsights.map((insight, i) => (
              <AIInsightCard key={insight.id} insight={insight} delay={i * 0.1 + 0.4} />
            ))}

            {/* Summary score */}
            <Card style={{ marginTop: "0.5rem", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>Decision Readiness</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: GOLD_L, fontFamily: "Inter,sans-serif" }}>72%</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD_L})`, borderRadius: 3 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[
                  { label: "Sources", val: "94%", ok: true },
                  { label: "Conflicts", val: "3 open", ok: false },
                  { label: "Stakeholders", val: "2 pending", ok: false },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "6px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.ok ? SILVER : GOLD, fontFamily: "Inter,sans-serif" }}>{item.val}</div>
                    <div style={{ fontSize: 9, color: SILVER_D, fontFamily: "Inter,sans-serif", marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <Link to="/canvas" style={{ textDecoration: "none" }}>
                <button className="btn-gold" style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, marginTop: 12 }}>
                  <Zap style={{ width: 13, height: 13 }} /> Run Full Analysis
                </button>
              </Link>
            </Card>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
