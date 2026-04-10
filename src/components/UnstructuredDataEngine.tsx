import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Zap, RotateCcw, FileText, Activity } from "lucide-react";

const rawText = `Meeting notes from Q3 review...
revenue up by 23%... John mentioned
risks in APAC compliance. Sarah
disagreed, citing board approval memo
from June. Budget allocated: $2.4M for
expansion. Timeline: Q4 2026. Action
items unclear. Multiple conflicting dates
mentioned...`;

interface StructuredCard {
  label: string;
  value: string;
  type: "info" | "safe" | "risk" | "conflict";
}

const structuredCards: StructuredCard[] = [
  { label: "Revenue Growth", value: "+23% YoY", type: "safe" },
  { label: "Budget Allocated", value: "$2.4M", type: "info" },
  { label: "Timeline", value: "Q4 2026", type: "info" },
  { label: "Risk Flagged", value: "APAC Compliance", type: "risk" },
  { label: "Conflict", value: "Dates inconsistent", type: "conflict" },
  { label: "Stakeholders", value: "John, Sarah", type: "info" },
];

const typeColors: Record<string, string> = {
  info: "hsl(217, 91%, 60%)",
  safe: "hsl(152, 80%, 50%)",
  risk: "hsl(38, 92%, 60%)",
  conflict: "hsl(340, 82%, 62%)",
};

const typeBg: Record<string, string> = {
  info: "rgba(96,165,250,0.06)",
  safe: "rgba(52,211,153,0.06)",
  risk: "rgba(251,191,36,0.06)",
  conflict: "rgba(248,113,113,0.06)",
};

export default function UnstructuredDataEngine() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [transformed, setTransformed] = useState(false);

  return (
    <section ref={ref} className="section-pad relative" style={{ background: "#000" }}>
      {/* Subtle violet glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 20% 50%, rgba(168,85,247,0.04) 0%, transparent 60%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="slash-label mb-5" style={{ display: "inline-flex", color: "hsl(217, 91%, 60%)", borderColor: "rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.06)" }}>
            Data Engine
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            Chaos to{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              clarity
            </em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "1rem", fontFamily: "'Inter', sans-serif", maxWidth: "38rem", margin: "1rem auto 0" }}>
            Watch unstructured text transform into actionable, structured intelligence.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <button
            id="transform-btn"
            onClick={() => setTransformed(!transformed)}
            className={transformed ? "btn-ghost" : "btn-primary"}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 2rem" }}
          >
            {transformed ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Show Raw Data
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Transform with AI
              </>
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-5"
        >
          {/* Raw input */}
          <motion.div
            animate={{ opacity: transformed ? 0.35 : 1, scale: transformed ? 0.98 : 1 }}
            transition={{ duration: 0.5 }}
            className="slash-card"
            style={{ padding: "1.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
              <FileText className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: "0.04em" }}>
                Unstructured Input
              </span>
              <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "hsl(340, 82%, 62%)", boxShadow: "0 0 5px hsl(340, 82%, 62%)" }} />
            </div>
            <pre style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', monospace", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
              {rawText}
            </pre>
          </motion.div>

          {/* Structured output */}
          <motion.div
            animate={{ opacity: transformed ? 1 : 0.25, scale: transformed ? 1 : 0.98 }}
            transition={{ duration: 0.5 }}
            className="slash-card"
            style={{ padding: "1.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
              <Activity className="w-4 h-4" style={{ color: "hsl(152, 80%, 50%)" }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: "0.04em" }}>
                Structured Output
              </span>
              <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "hsl(152, 80%, 50%)", boxShadow: "0 0 5px hsl(152, 80%, 50%)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {structuredCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ opacity: transformed ? 1 : 0.2, x: transformed ? 0 : 16 }}
                  transition={{ duration: 0.4, delay: transformed ? i * 0.07 : 0 }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.625rem",
                    background: typeBg[card.type],
                    border: `1px solid ${typeColors[card.type]}20`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: typeColors[card.type], display: "inline-block" }} />
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}>{card.label}</span>
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif" }}>{card.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
