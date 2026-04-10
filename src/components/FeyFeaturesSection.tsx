import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Video, FileText, GitBranch, Shield, BarChart3,
  CheckCircle, ArrowRight, Zap
} from "lucide-react";

/* ── Gold/Silver palette ── */
const GOLD      = "#C9A227";
const GOLD_L    = "#F0C040";
const SILVER    = "#B8B8B8";
const SILVER_D  = "#737373";

const FEATURES = [
  {
    id: "gmail", icon: Mail, label: "Gmail",
    title: "Turn emails into\ndecisions, instantly.",
    subtitle: "Gmail Integration",
    description: "DecisionDNA connects to your Gmail and automatically surfaces threads that require a decision. AI extracts key facts, flags conflicting positions, and adds them directly to your Decision Canvas.",
    accent: GOLD,
    bullets: ["Auto-detect decision threads", "Extract conflicting positions", "Add sources to canvas"],
    preview: <GmailPreview />,
  },
  {
    id: "meet", icon: Video, label: "Google Meet",
    title: "Every meeting becomes\na decision graph.",
    subtitle: "Google Meet Integration",
    description: "Live transcription of Google Meet calls is analyzed in real-time. Action items, commitments, and disagreements are automatically extracted and visualized as a decision flow.",
    accent: SILVER,
    bullets: ["Real-time transcript analysis", "Extract commitments & blockers", "Auto-generate decision nodes"],
    preview: <MeetPreview />,
  },
  {
    id: "docs", icon: FileText, label: "Google Docs",
    title: "Documents become\nstructured intelligence.",
    subtitle: "Google Docs Integration",
    description: "Connect your Drive and watch documents, reports, and briefs transform into structured knowledge. DecisionDNA maps entities, relationships, and conflicts across your entire document library.",
    accent: GOLD_L,
    bullets: ["Parse PDFs, Docs, Sheets", "Build knowledge graph", "Source-attributed insights"],
    preview: <DocsPreview />,
  },
  {
    id: "canvas", icon: GitBranch, label: "Canvas",
    title: "Visual decision\nmapping at warp speed.",
    subtitle: "Decision Canvas",
    description: "A drag-and-drop canvas where every node is a decision, fact, or stakeholder. Connect them, weight them, and watch AI trace the optimal path while flagging all conflicts.",
    accent: SILVER,
    bullets: ["Drag & drop nodes", "AI-suggested connections", "Conflict highlighting"],
    preview: <CanvasPreview />,
  },
  {
    id: "conflict", icon: Shield, label: "Conflict Detection",
    title: "No contradiction\ngoes unnoticed.",
    subtitle: "Conflict Detection Engine",
    description: "Our AI cross-references every source — emails, docs, transcripts — and instantly surfaces contradictions. You see exactly which document says what, and why they conflict.",
    accent: GOLD,
    bullets: ["Cross-source contradiction scan", "Pin-point conflict location", "Suggested resolutions"],
    preview: <ConflictPreview />,
  },
  {
    id: "impact", icon: BarChart3, label: "Impact Sim",
    title: "Model outcomes\nbefore you decide.",
    subtitle: "What-If Impact Simulator",
    description: "Change one variable and instantly see how risk propagates across your entire decision graph. Model multiple scenarios and compare their downstream effects side by side.",
    accent: GOLD_L,
    bullets: ["Risk propagation modeling", "Multi-scenario comparison", "Confidence score forecasts"],
    preview: <ImpactPreview />,
  },
] as const;

/* ── Shared card shell for previews ── */
const PC: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(30,28,24,0.98) 0%, rgba(12,10,8,0.98) 100%)",
  border: `1px solid rgba(201,162,39,0.22)`,
  borderRadius: 20,
  padding: "20px 20px 16px",
  width: "100%",
  boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset",
  backdropFilter: "blur(20px)",
};
const ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "8px 10px", borderRadius: 10,
  background: "rgba(255,255,255,0.03)",
  marginBottom: 5,
};
const HDR: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  marginBottom: 14, paddingBottom: 12,
  borderBottom: "1px solid rgba(201,162,39,0.12)",
};
const BADGE = (accent: string): React.CSSProperties => ({
  fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
  background: `${accent}18`, color: accent,
  border: `1px solid ${accent}35`,
  letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "Inter",
});
const AI_ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7,
  padding: "9px 12px", borderRadius: 10,
  background: "rgba(201,162,39,0.06)",
  border: "1px solid rgba(201,162,39,0.2)",
  marginTop: 8,
};

function GmailPreview() {
  const emails = [
    { from: "Sarah Chen", subject: "APAC Expansion — Risk concerns?", time: "2m", flag: true },
    { from: "Board Office", subject: "Q3 Approval: Expansion greenlit", time: "1h", flag: false },
    { from: "Legal Team", subject: "Compliance review outstanding", time: "3h", flag: true },
  ];
  return (
    <div style={PC}>
      <div style={HDR}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail style={{ width: 13, height: 13, color: GOLD }} />
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter", flex: 1, fontWeight: 500 }}>Gmail · Decision Threads</span>
        <span style={BADGE(GOLD)}>2 conflicts</span>
      </div>
      {emails.map((e, i) => (
        <div key={i} style={{ ...ROW, borderLeft: `2px solid ${e.flag ? GOLD : "transparent"}`, paddingLeft: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter", fontWeight: 700 }}>{e.from[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter", fontWeight: 600 }}>{e.from}</div>
            <div style={{ fontSize: 11, color: SILVER_D, fontFamily: "Inter", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject}</div>
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "Inter" }}>{e.time}</span>
        </div>
      ))}
      <div style={AI_ROW}>
        <Zap style={{ width: 11, height: 11, color: GOLD, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}>AI detected conflict between Sarah's email and Board approval</span>
      </div>
    </div>
  );
}

function MeetPreview() {
  const items = [
    { time: "02:14", speaker: "Alex", text: "We should delay the Q4 expansion.", type: "risk" },
    { time: "05:31", speaker: "Priya", text: "Revenue data strongly supports moving forward.", type: "safe" },
    { time: "08:47", speaker: "Mark", text: "Compliance review is still pending.", type: "conflict" },
  ];
  const tc: Record<string, string> = { risk: GOLD, safe: SILVER, conflict: "rgba(255,255,255,0.5)" };
  return (
    <div style={PC}>
      <div style={HDR}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${SILVER}14`, border: `1px solid ${SILVER}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Video style={{ width: 13, height: 13, color: SILVER }} />
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter", flex: 1, fontWeight: 500 }}>Meet · APAC Strategy Call</span>
        <span style={BADGE(GOLD)}>LIVE</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: 10, color: SILVER_D, fontFamily: "monospace", letterSpacing: "0.04em", paddingTop: 1, minWidth: 36 }}>{item.time}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: tc[item.type], fontWeight: 700, fontFamily: "Inter" }}>{item.speaker}: </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter" }}>{item.text}</span>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: tc[item.type], marginTop: 5, flexShrink: 0 }} />
        </div>
      ))}
      <div style={AI_ROW}>
        <Zap style={{ width: 11, height: 11, color: GOLD, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}>3 decision nodes auto-generated from this meeting</span>
      </div>
    </div>
  );
}

function DocsPreview() {
  const docs = [
    { name: "Q3 Revenue Report.pdf", entities: 14, status: "parsed" },
    { name: "Risk Assessment v2.docx", entities: 9, status: "conflict" },
    { name: "Board Approval Memo.md", entities: 6, status: "parsed" },
  ];
  const sc: Record<string, string> = { parsed: SILVER, conflict: GOLD };
  return (
    <div style={PC}>
      <div style={HDR}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD_L}14`, border: `1px solid ${GOLD_L}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText style={{ width: 13, height: 13, color: GOLD_L }} />
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter", flex: 1, fontWeight: 500 }}>Docs · Knowledge Base</span>
        <span style={BADGE(GOLD_L)}>3 sources</span>
      </div>
      {docs.map((doc, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: `${GOLD_L}10`, border: `1px solid ${GOLD_L}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText style={{ width: 13, height: 13, color: GOLD_L }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
            <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter", marginTop: 2 }}>{doc.entities} entities extracted</div>
          </div>
          <span style={{ ...BADGE(sc[doc.status]) }}>{doc.status}</span>
        </div>
      ))}
    </div>
  );
}

function CanvasPreview() {
  const nodes = [
    { label: "Data Input", x: 70, y: 65, t: "info" },
    { label: "Risk Check", x: 230, y: 42, t: "risk" },
    { label: "Compliance", x: 210, y: 145, t: "safe" },
    { label: "Decision", x: 350, y: 95, t: "decision" },
  ];
  const nc: Record<string, string> = { info: SILVER_D, risk: GOLD, safe: SILVER, decision: GOLD_L };
  return (
    <div style={PC}>
      <div style={HDR}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${SILVER}10`, border: `1px solid ${SILVER}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GitBranch style={{ width: 13, height: 13, color: SILVER }} />
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter", fontWeight: 500 }}>Canvas · decision_q4.canvas</span>
      </div>
      <svg viewBox="0 0 420 210" style={{ width: "100%", height: 150 }}>
        <defs>
          <marker id="arrowGold" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5 z" fill={`${GOLD}60`} />
          </marker>
        </defs>
        {[["70,65", "230,42"], ["70,65", "210,145"], ["230,42", "350,95"], ["210,145", "350,95"]].map(([s, e], i) => {
          const [x1, y1] = s.split(",").map(Number);
          const [x2, y2] = e.split(",").map(Number);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${GOLD}30`} strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#arrowGold)" />;
        })}
        {nodes.map((n, i) => (
          <g key={i}>
            <rect x={n.x - 52} y={n.y - 20} width={104} height={40} rx={10} fill={`${nc[n.t]}10`} stroke={nc[n.t]} strokeWidth={1.5} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={11} fontFamily="Inter" fontWeight="500">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ConflictPreview() {
  return (
    <div style={PC}>
      <div style={HDR}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD}14`, border: `1px solid ${GOLD}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield style={{ width: 13, height: 13, color: GOLD }} />
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter", flex: 1, fontWeight: 500 }}>Conflict · Scan Results</span>
        <span style={BADGE(GOLD)}>2 found</span>
      </div>
      {[
        { src1: "Board Memo (p.3)", src2: "Risk Assessment (p.7)", issue: "Conflicting APAC timelines", sev: "High" },
        { src1: "CEO Email", src2: "Legal Report", issue: "Compliance status disagreement", sev: "Medium" },
      ].map((c, i) => (
        <div key={i} style={{ padding: "12px", borderRadius: 10, background: `${GOLD}08`, border: `1px solid ${GOLD}25`, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <Shield style={{ width: 10, height: 10, color: c.sev === "High" ? GOLD : SILVER }} />
            <span style={{ fontSize: 9, color: c.sev === "High" ? GOLD : SILVER, fontWeight: 700, fontFamily: "Inter", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.sev} severity</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Inter", fontWeight: 600, marginBottom: 4 }}>{c.issue}</div>
          <div style={{ fontSize: 10, color: SILVER_D, fontFamily: "Inter" }}>{c.src1} vs {c.src2}</div>
        </div>
      ))}
    </div>
  );
}

function ImpactPreview() {
  const bars = [
    { label: "Revenue Model", v: 65, color: GOLD },
    { label: "Market Entry", v: 80, color: GOLD_L },
    { label: "Compliance", v: 45, color: SILVER },
    { label: "Hiring Plan", v: 30, color: SILVER_D },
  ];
  return (
    <div style={PC}>
      <div style={HDR}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD_L}14`, border: `1px solid ${GOLD_L}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 style={{ width: 13, height: 13, color: GOLD_L }} />
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter", flex: 1, fontWeight: 500 }}>Impact Simulator</span>
        <span style={BADGE(GOLD_L)}>Active</span>
      </div>
      {bars.map((b, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Inter" }}>{b.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: b.color, fontFamily: "Inter" }}>Risk: {b.v}%</span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div animate={{ width: `${b.v}%` }} transition={{ duration: 1.4, delay: i * 0.12 }}
              style={{ height: "100%", background: `linear-gradient(90deg, ${b.color}80, ${b.color})`, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   MAIN — True Fey.com scroll-locked section
────────────────────────────────────────────────── */
export default function FeyFeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [featureProgress, setFeatureProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const scrolledIn = -rect.top;
      if (scrolledIn < 0) return;
      const totalScrollable = rect.height - window.innerHeight;
      const scrollFraction = Math.min(1, Math.max(0, scrolledIn / totalScrollable));
      const featureF = scrollFraction * FEATURES.length;
      setActiveIndex(Math.min(FEATURES.length - 1, Math.floor(featureF)));
      setFeatureProgress(featureF - Math.floor(featureF));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const feature = FEATURES[activeIndex];
  const Icon = feature.icon;

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{ height: `calc(${FEATURES.length * 100}vh + 200px)`, position: "relative", background: "#000" }}
    >
      {/* Section header */}
      <div style={{ textAlign: "center", padding: "7rem 1.5rem 5rem" }}>
        <p className="slash-label slash-label-accent" style={{ display: "inline-flex", marginBottom: "1.25rem" }}>
          Integrations &amp; Features
        </p>
        <h2 className="font-display" style={{ fontSize: "clamp(2.4rem,5.5vw,4rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}>
          Everything connected,{" "}
          <em className="text-gold" style={{ fontStyle: "italic", fontWeight: 300 }}>nothing missed.</em>
        </h2>
      </div>

      {/* ── STICKY FRAME ── */}
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Subtle gold bg glow */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 55% 55% at 72% 52%, ${GOLD}07, transparent 65%)`, transition: "opacity 0.6s", pointerEvents: "none" }} />
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(201,162,39,0.07) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)" }} />

        {/* ── PILL NAV BAR ── */}
        <div style={{ position: "relative", zIndex: 20, display: "flex", justifyContent: "center", padding: "1.25rem 1.5rem" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 2, padding: "4px",
            borderRadius: 9999,
            background: "rgba(8,7,5,0.92)",
            backdropFilter: "blur(30px)",
            border: "1px solid rgba(201,162,39,0.18)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset",
          }}>
            {FEATURES.map((f, i) => {
              const FIcon = f.icon;
              const isActive = i === activeIndex;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    if (!sectionRef.current) return;
                    const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
                    const totalScrollable = sectionRef.current.offsetHeight - window.innerHeight;
                    window.scrollTo({ top: sectionTop + (i / FEATURES.length) * totalScrollable, behavior: "smooth" });
                  }}
                  style={{
                    position: "relative", display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 9999, cursor: "pointer",
                    color: isActive ? "#000" : "rgba(255,255,255,0.38)",
                    fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: isActive ? 700 : 400,
                    whiteSpace: "nowrap", zIndex: 1, transition: "color 0.2s", userSelect: "none",
                  }}
                >
                  {isActive && (
                    <motion.div layoutId="fey-pill"
                      transition={{ type: "spring", stiffness: 460, damping: 42 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 9999, background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD})`, zIndex: -1, boxShadow: `0 2px 12px ${GOLD}40` }}
                    />
                  )}
                  <FIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                  <span>{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bars below pill */}
        <div style={{ position: "relative", zIndex: 20, display: "flex", justifyContent: "center", paddingBottom: "0.375rem" }}>
          <div style={{ display: "flex", gap: 3 }}>
            {FEATURES.map((f, i) => (
              <div key={f.id} style={{ width: 44, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD_L})`, borderRadius: 2 }}
                  animate={{ width: i < activeIndex ? "100%" : i === activeIndex ? `${featureProgress * 100}%` : "0%" }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", maxWidth: "72rem", margin: "0 auto", padding: "0.5rem 2rem 3.5rem", width: "100%", position: "relative", zIndex: 10 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4.5rem", alignItems: "center", width: "100%" }}
            >
              {/* TEXT */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${feature.accent}12`, border: `1px solid ${feature.accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 20, height: 20, color: feature.accent }} />
                  </div>
                  <span style={{ fontSize: "0.6875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: feature.accent, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
                    {feature.subtitle}
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: "clamp(1.9rem,3.5vw,2.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.08, marginBottom: "1.25rem", whiteSpace: "pre-line" }}>
                  {feature.title}
                </h3>

                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", lineHeight: 1.82, marginBottom: "1.75rem", maxWidth: "30rem" }}>
                  {feature.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "2rem" }}>
                  {feature.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${GOLD}12`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle style={{ width: 10, height: 10, color: GOLD }} />
                      </div>
                      <span style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, sans-serif" }}>{b}</span>
                    </div>
                  ))}
                </div>

                <button style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.875rem", color: GOLD_L, fontFamily: "Inter, sans-serif", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                  Learn more <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* PREVIEW — always visible with gold glow */}
              <div style={{ position: "relative" }}>
                {/* Gold glow behind card */}
                <div style={{ position: "absolute", inset: "-20%", background: `radial-gradient(ellipse 70% 70% at 50% 50%, ${GOLD}0d, transparent 70%)`, pointerEvents: "none", filter: "blur(20px)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  {feature.preview}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Left progress bar */}
        <div style={{ position: "absolute", left: "clamp(14px,2vw,28px)", top: "50%", transform: "translateY(-50%)", zIndex: 30, display: "flex", flexDirection: "column", gap: 6, pointerEvents: "none" }}>
          {FEATURES.map((f, i) => {
            const isPast = i < activeIndex;
            const isCurrent = i === activeIndex;
            return (
              <div key={f.id} style={{ width: 2, height: 28, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <motion.div
                  style={{ width: "100%", background: `linear-gradient(to bottom, ${GOLD_L}, ${GOLD})`, borderRadius: 2 }}
                  animate={{ height: isPast ? "100%" : isCurrent ? `${featureProgress * 100}%` : "0%" }}
                  transition={{ duration: 0.06 }}
                />
              </div>
            );
          })}
        </div>

        {/* Scroll hint */}
        {activeIndex === 0 && featureProgress < 0.25 && (
          <div style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "none" }}>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ width: 1, height: 32, background: `linear-gradient(to bottom, ${GOLD}60, transparent)` }} />
            <span style={{ fontSize: "0.625rem", color: SILVER_D, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll to explore</span>
          </div>
        )}
      </div>
    </section>
  );
}
