import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Zap, RotateCcw } from "lucide-react";

interface SimNode {
  id: string;
  label: string;
  x: number;
  y: number;
  risk: number;
  affected: boolean;
}

const baseNodes: SimNode[] = [
  { id: "a", label: "Revenue Model", x: 110, y: 90, risk: 10, affected: false },
  { id: "b", label: "Market Entry", x: 310, y: 60, risk: 15, affected: false },
  { id: "c", label: "Compliance", x: 290, y: 200, risk: 20, affected: false },
  { id: "d", label: "Hiring Plan", x: 510, y: 90, risk: 5, affected: false },
  { id: "e", label: "Budget", x: 490, y: 210, risk: 10, affected: false },
];

const impactNodes: SimNode[] = [
  { id: "a", label: "Revenue Model", x: 110, y: 90, risk: 65, affected: true },
  { id: "b", label: "Market Entry", x: 310, y: 60, risk: 80, affected: true },
  { id: "c", label: "Compliance", x: 290, y: 200, risk: 45, affected: true },
  { id: "d", label: "Hiring Plan", x: 510, y: 90, risk: 30, affected: false },
  { id: "e", label: "Budget", x: 490, y: 210, risk: 55, affected: true },
];

const edges: [string, string][] = [
  ["a", "b"], ["a", "c"], ["b", "d"], ["c", "e"], ["b", "e"],
];

function getRiskColor(risk: number) {
  if (risk > 60) return "#f87171";
  if (risk > 30) return "#fbbf24";
  return "#34d399";
}

export default function ImpactSimulator() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [simulating, setSimulating] = useState(false);
  const nodes = simulating ? impactNodes : baseNodes;

  return (
    <section ref={ref} className="section-pad relative" style={{ background: "#000" }}>
      {/* Soft radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(251,191,36,0.04) 0%, transparent 60%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="slash-label mb-5" style={{ display: "inline-flex", color: "hsl(38, 92%, 60%)", borderColor: "rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.06)" }}>
            Impact Analysis
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "hsl(38, 92%, 60%)" }}>What if</em>{" "}
            Simulator
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "1rem", fontFamily: "'Inter', sans-serif", maxWidth: "38rem", margin: "1rem auto 0" }}>
            Toggle a change and instantly see how risk propagates across your decision graph.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="slash-card"
          style={{ overflow: "hidden" }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span className="mono-tag">impact_simulation.canvas</span>
            <button
              id="impact-simulate-btn"
              onClick={() => setSimulating(!simulating)}
              className={simulating ? "btn-ghost btn-sm" : "btn-primary btn-sm"}
              style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              {simulating ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Simulation
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Simulate Market Change
                </>
              )}
            </button>
          </div>

          {/* SVG */}
          <div style={{ padding: "1.5rem" }}>
            <svg viewBox="0 0 630 290" className="w-full h-auto">
              <defs>
                {["a", "b", "c", "d", "e"].map(id => (
                  <filter key={id} id={`pulse-${id}`}>
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feFlood floodColor="#f87171" floodOpacity="0.5" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
              </defs>

              {/* Edges */}
              {edges.map(([from, to], i) => {
                const a = nodes.find(n => n.id === from)!;
                const b = nodes.find(n => n.id === to)!;
                const bothAffected = simulating && a.affected && b.affected;
                return (
                  <motion.line
                    key={i}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={bothAffected ? "#f87171" : "rgba(255,255,255,0.08)"}
                    strokeWidth={bothAffected ? 1.5 : 1}
                    strokeDasharray={bothAffected ? "none" : "8 6"}
                    initial={false}
                    animate={{ opacity: bothAffected ? 0.7 : 0.35 }}
                    transition={{ duration: 0.5 }}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => (
                <g key={node.id}>
                  {/* Pulse ring for affected */}
                  <AnimatePresence>
                    {simulating && node.affected && (
                      <motion.circle
                        cx={node.x} cy={node.y} r={48}
                        fill="none"
                        stroke={getRiskColor(node.risk)}
                        strokeWidth={0.8}
                        initial={{ opacity: 0, r: 32 }}
                        animate={{ opacity: [0.4, 0], r: [38, 58] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.6 }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.rect
                    x={node.x - 60} y={node.y - 24} width={120} height={48} rx={12}
                    fill={`${getRiskColor(node.risk)}10`}
                    stroke={getRiskColor(node.risk)}
                    strokeWidth={simulating && node.affected ? 1.5 : 0.8}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <text x={node.x} y={node.y - 4} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
                    {node.label}
                  </text>
                  <text x={node.x} y={node.y + 13} textAnchor="middle" fill={getRiskColor(node.risk)} fontSize="9.5" fontFamily="Inter, monospace" fontWeight="600">
                    Risk: {node.risk}%
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              padding: "0.875rem 1.5rem",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {[{ label: "Low risk", color: "#34d399" }, { label: "Medium risk", color: "#fbbf24" }, { label: "High risk", color: "#f87171" }].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
