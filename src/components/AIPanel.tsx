import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";

function ConfidenceRing({ value }: { value: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <motion.circle
          cx="44" cy="44" r={r} fill="none"
          stroke="url(#ai-grad)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, delay: 0.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ai-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--teal))" />
            <stop offset="100%" stopColor="hsl(var(--violet))" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="font-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff" }}>{value}%</span>
      </div>
    </div>
  );
}

const sources = [
  { title: "Q3 Revenue Report.pdf", highlight: "Revenue grew 23% YoY driven by enterprise adoption", page: "p. 14", icon: FileText },
  { title: "Risk Assessment v2.docx", highlight: "Potential regulatory conflict in APAC region flagged", page: "p. 7", icon: AlertTriangle },
  { title: "Board Meeting Notes.md", highlight: "Board approved expansion pending compliance review", page: "p. 3", icon: CheckCircle },
];

const scoreItems = [
  { label: "Revenue data", status: "High confidence", color: "hsl(152, 80%, 50%)" },
  { label: "Compliance", status: "Moderate", color: "hsl(38, 92%, 60%)" },
  { label: "Regulatory risk", status: "Flagged", color: "hsl(340, 82%, 62%)" },
];

export default function AIPanel() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad relative" style={{ background: "#000" }} id="explainability">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="slash-label mb-5" style={{ display: "inline-flex", borderColor: "rgba(252,83,68,0.2)", color: "hsl(var(--violet))" }}>
            Explainability Engine
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            AI that{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              shows its work
            </em>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Main answer panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 slash-card"
            style={{ padding: "1.75rem" }}
          >
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <span className="dot-live" />
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--teal))", fontFamily: "'Inter', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
                AI-Generated Answer
              </span>
            </div>

            {/* Answer text */}
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif", lineHeight: 1.8, marginBottom: "1.5rem" }}>
              Based on analysis of{" "}
              <span style={{ color: "#fff", fontWeight: 500 }}>3 source documents</span>,
              the recommended decision is to{" "}
              <span style={{ color: "hsl(152, 80%, 50%)", fontWeight: 500 }}>proceed with APAC expansion</span>{" "}
              with a{" "}
              <span style={{ color: "hsl(38, 92%, 60%)", fontWeight: 500 }}>conditional compliance review</span>.
              Revenue projections support the move, but regulatory risks require additional due diligence.
            </p>

            {/* Conflict alert */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.9 }}
              style={{
                border: "1px solid rgba(248,113,113,0.2)",
                background: "rgba(248,113,113,0.05)",
                borderRadius: "0.875rem",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(340, 82%, 62%)" }} />
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(340, 82%, 62%)", fontFamily: "'Inter', sans-serif" }}>
                  Conflicting Information Detected
                </p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", marginTop: "0.25rem", lineHeight: 1.6 }}>
                  Board notes approve expansion, but Risk Assessment flags unresolved regulatory issues in APAC.
                </p>
              </div>
            </motion.div>

            {/* Sources */}
            <div>
              <p style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: "0.75rem" }}>
                Source Documents
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {sources.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.5 + i * 0.12 }}
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 1rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif" }}>
                            {s.title}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', monospace" }}>{s.page}</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                        "…<span style={{ color: "hsl(38, 92%, 60%)", background: "rgba(251,191,36,0.08)", padding: "0 3px", borderRadius: 3 }}>{s.highlight}</span>…"
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Confidence panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 slash-card"
            style={{ padding: "1.75rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}
          >
            <p style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
              Confidence Score
            </p>
            <ConfidenceRing value={87} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
              {scoreItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, display: "inline-block", boxShadow: `0 0 5px ${item.color}` }} />
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: item.color, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{item.status}</span>
                </div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div style={{ width: "100%", marginTop: "0.5rem" }}>
              {[{ label: "Revenue", pct: 88, color: "hsl(152, 80%, 50%)" }, { label: "Compliance", pct: 62, color: "hsl(38, 92%, 60%)" }, { label: "Regulatory", pct: 34, color: "hsl(340, 82%, 62%)" }].map((bar, i) => (
                <div key={i} style={{ marginBottom: "0.625rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}>{bar.label}</span>
                    <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}>{bar.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${bar.pct}%` } : {}}
                      transition={{ duration: 1.2, delay: 0.6 + i * 0.15, ease: "easeOut" }}
                      style={{ height: "100%", background: bar.color, borderRadius: 2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
