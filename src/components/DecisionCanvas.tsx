import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";

type NodeType = "safe" | "risk" | "conflict" | "info";
interface CanvasNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  timestamp: string;
}
interface Connection {
  from: string;
  to: string;
}

const initialNodes: CanvasNode[] = [
  { id: "1", label: "Data Collection", type: "info", x: 90, y: 70, timestamp: "10:00" },
  { id: "2", label: "Risk Assessment", type: "risk", x: 310, y: 50, timestamp: "10:15" },
  { id: "3", label: "Compliance Check", type: "safe", x: 290, y: 190, timestamp: "10:30" },
  { id: "4", label: "Conflict Detected", type: "conflict", x: 530, y: 110, timestamp: "10:45" },
  { id: "5", label: "Final Decision", type: "safe", x: 510, y: 250, timestamp: "11:00" },
];

const connections: Connection[] = [
  { from: "1", to: "2" }, { from: "1", to: "3" },
  { from: "2", to: "4" }, { from: "3", to: "5" }, { from: "4", to: "5" },
];

const nodeColors: Record<NodeType, string> = {
  safe: "#34d399",
  risk: "#fbbf24",
  conflict: "#f87171",
  info: "#60a5fa",
};

const nodeBg: Record<NodeType, string> = {
  safe: "rgba(52,211,153,0.08)",
  risk: "rgba(251,191,36,0.08)",
  conflict: "rgba(248,113,113,0.08)",
  info: "rgba(96,165,250,0.08)",
};

const nodeLabels: Record<NodeType, string> = {
  safe: "Safe",
  risk: "Risk",
  conflict: "Conflict",
  info: "Info",
};

export default function DecisionCanvas() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [nodes, setNodes] = useState(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((id: string) => setDragging(id), []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    const scaleY = 340 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: Math.max(70, Math.min(x, 620)), y: Math.max(30, Math.min(y, 310)) } : n));
  }, [dragging]);
  const handleMouseUp = useCallback(() => setDragging(null), []);

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return (
    <section ref={ref} className="section-pad relative" style={{ background: "#000" }}>
      {/* Subtle diagonal grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="slash-label slash-label-accent mb-5" style={{ display: "inline-flex" }}>Interactive Demo</p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            Visual{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Decision Canvas
            </em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "1rem", fontFamily: "'Inter', sans-serif", maxWidth: "38rem", margin: "1rem auto 0" }}>
            Drag nodes, trace connections, and see how decisions flow from input to outcome.
          </p>
        </motion.div>

        {/* Canvas Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="slash-card"
          style={{ padding: "0", overflow: "hidden" }}
        >
          {/* Mac-style toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.875rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {["#f87171", "#fbbf24", "#34d399"].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span className="mono-tag">decision_flow.canvas</span>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {(Object.keys(nodeColors) as NodeType[]).map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: nodeColors[t], display: "inline-block" }} />
                  {nodeLabels[t]}
                </span>
              ))}
            </div>
          </div>

          {/* SVG canvas */}
          <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.01)" }}>
            <svg
              ref={svgRef}
              viewBox="0 0 680 340"
              className="w-full h-auto select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: dragging ? "grabbing" : "default" }}
            >
              {/* Animated gradient defs */}
              <defs>
                <linearGradient id="connection-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--teal))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--violet))" stopOpacity="0.3" />
                </linearGradient>
                {(Object.keys(nodeColors) as NodeType[]).map(t => (
                  <filter key={t} id={`glow-${t}`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodColor={nodeColors[t]} floodOpacity="0.5" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
              </defs>

              {/* Connections */}
              {connections.map((c, i) => {
                const from = getNode(c.from);
                const to = getNode(c.to);
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="url(#connection-grad)"
                      strokeWidth="1"
                      strokeDasharray="8 6"
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const isHovered = hoveredNode === node.id;
                return (
                  <g
                    key={node.id}
                    onMouseDown={() => handleMouseDown(node.id)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: dragging === node.id ? "grabbing" : "grab" }}
                    filter={isHovered ? `url(#glow-${node.type})` : undefined}
                  >
                    {/* Node background */}
                    <rect
                      x={node.x - 68} y={node.y - 26} width={136} height={52} rx={12}
                      fill={nodeBg[node.type]}
                      stroke={nodeColors[node.type]}
                      strokeWidth={isHovered ? 1.5 : 0.8}
                      opacity={isHovered ? 1 : 0.8}
                    />
                    {/* Label */}
                    <text
                      x={node.x} y={node.y - 5}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.88)"
                      fontSize="11.5"
                      fontWeight="500"
                      fontFamily="Inter, sans-serif"
                    >
                      {node.label}
                    </text>
                    {/* Timestamp */}
                    <text
                      x={node.x} y={node.y + 13}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.3)"
                      fontSize="9.5"
                      fontFamily="Inter, monospace"
                      letterSpacing="0.05em"
                    >
                      {node.timestamp}
                    </text>
                    {/* Type indicator */}
                    <circle cx={node.x + 50} cy={node.y - 18} r={3} fill={nodeColors[node.type]} opacity={0.8} />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Footer hint */}
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>
              Tip: Drag any node to rearrange the decision flow
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
