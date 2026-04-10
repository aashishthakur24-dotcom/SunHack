import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Play, Sparkles, AlertTriangle, CheckCircle2, FileText, Mail, Video, GitBranch, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "10×", label: "Faster decisions" },
  { value: "97%", label: "Accuracy rate" },
  { value: "3s", label: "Avg analysis time" },
  { value: "500+", label: "Teams onboarded" },
];

const QUICK_TRIES = [
  { label: "Simulate Hiring Conflict", prompt: "Analyze the hiring committee emails and HR policy docs regarding the senior engineer role — flag any contradictions between department heads." },
  { label: "Analyze Budget Threads", prompt: "Review Q3 budget approval threads across Finance and Board emails and identify conflicting spend approvals for APAC expansion." },
  { label: "Compliance vs. Board", prompt: "Map the compliance team notes against the board meeting minutes for Project Phoenix and surface any regulatory conflicts." },
];

const CONFIDENCE_ITEMS = [
  { label: "Revenue Projections", score: 88, level: "High", color: "#34d399" },
  { label: "Risk Assessment", score: 62, level: "Medium", color: "#f59e0b" },
  { label: "Board Approval Status", score: 31, level: "Low — Conflict Detected", color: "#f87171", conflict: true },
];

// ── Chaos side: messy source icons ──
function ChaosPanel() {
  const items = [
    { icon: Mail, label: "Gmail", color: "#EA4335", top: "12%", left: "8%", rotate: -12 },
    { icon: Video, label: "Meet", color: "#00897B", top: "8%", left: "52%", rotate: 8 },
    { icon: FileText, label: "Docs", color: "#4285F4", top: "38%", left: "28%", rotate: -5 },
    { icon: FileText, label: "PDF Report", color: "#FF6D00", top: "55%", left: "10%", rotate: 14 },
    { icon: Mail, label: "Slack Export", color: "#611f69", top: "60%", left: "56%", rotate: -9 },
    { icon: FileText, label: "Board Mins", color: "#34A853", top: "28%", left: "62%", rotate: 6 },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* tangled lines canvas */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.22 }}
        viewBox="0 0 240 320"
        preserveAspectRatio="none"
      >
        {[
          "M40 50 C80 120, 160 80, 200 160",
          "M120 30 C60 100, 180 140, 80 220",
          "M20 160 C100 100, 160 200, 220 120",
          "M60 240 C140 180, 80 100, 200 80",
          "M160 260 C100 200, 40 160, 120 80",
        ].map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke={["#EA4335", "#4285F4", "#FF6D00", "#00897B", "#611f69"][i]}
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 + i * 0.3, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: "backOut" }}
            style={{
              position: "absolute",
              top: item.top,
              left: item.left,
              transform: `rotate(${item.rotate}deg)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${item.color}18`,
                border: `1px solid ${item.color}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon style={{ width: 18, height: 18, color: item.color }} />
            </div>
            <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          </motion.div>
        );
      })}

      {/* "Chaos" label */}
      <div
        style={{
          position: "absolute",
          bottom: "0.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
        }}
      >
        Scattered Sources
      </div>
    </div>
  );
}

// ── Clarity side: structured canvas with conflict badge ──
function ClarityPanel() {
  const nodes = [
    { label: "Board Minutes", x: "50%", y: "12%", color: "#34d399" },
    { label: "Risk Doc v3", x: "20%", y: "42%", color: "#60a5fa" },
    { label: "Compliance Brief", x: "78%", y: "42%", color: "#a78bfa" },
    { label: "Q3 Decision", x: "50%", y: "72%", color: "#f87171" },
  ];

  const edges = [
    { x1: "50%", y1: "16%", x2: "20%", y2: "38%" },
    { x1: "50%", y1: "16%", x2: "78%", y2: "38%" },
    { x1: "20%", y1: "46%", x2: "50%", y2: "68%" },
    { x1: "78%", y1: "46%", x2: "50%", y2: "68%" },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Graph edges */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 240 320" preserveAspectRatio="none">
        {edges.map((e, i) => (
          <motion.line
            key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.2, duration: 0.6 }}
          />
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.15, duration: 0.5, ease: "backOut" }}
          style={{
            position: "absolute",
            top: node.y,
            left: node.x,
            transform: "translate(-50%, -50%)",
            padding: "0.35rem 0.65rem",
            background: `${node.color}12`,
            border: `1px solid ${node.color}40`,
            borderRadius: 8,
            fontSize: "0.6rem",
            color: node.color,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
          }}
        >
          {node.label}
        </motion.div>
      ))}

      {/* Conflict badge — the star of the show */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6, ease: "backOut" }}
        style={{
          position: "absolute",
          top: "52%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.4rem 0.75rem",
          background: "rgba(248,71,71,0.15)",
          border: "1px solid rgba(248,71,71,0.5)",
          borderRadius: 9999,
          backdropFilter: "blur(12px)",
          boxShadow: "0 0 20px rgba(248,71,71,0.3)",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <AlertTriangle style={{ width: 11, height: 11, color: "#f87171" }} />
        </motion.div>
        <span style={{ fontSize: "0.6rem", color: "#f87171", fontFamily: "Inter, sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>
          Conflict: Compliance vs. Board Approval
        </span>
      </motion.div>

      {/* "Clarity" label */}
      <div
        style={{
          position: "absolute",
          bottom: "0.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
        }}
      >
        Structured Canvas
      </div>
    </div>
  );
}

// ── Chaos → Clarity split graphic ──
function ChaosToClarityGraphic() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.0, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "relative",
        height: "clamp(380px, 52vh, 600px)",
        borderRadius: "1.5rem",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(8px)",
        display: "flex",
      }}
    >
      {/* Glow behind graphic */}
      <div style={{
        position: "absolute",
        inset: "10%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(82,218,196,0.08), rgba(248,71,71,0.06) 60%, transparent 100%)",
        filter: "blur(40px)",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      {/* LEFT — Chaos */}
      <div style={{ flex: 1, position: "relative", zIndex: 1, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem 0.5rem 1.25rem 1rem" }}>
        <ChaosPanel />
      </div>

      {/* Center divider with arrow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "rgba(0,0,0,0.8)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
      }}>
        <ArrowRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.6)" }} />
      </div>

      {/* RIGHT — Clarity */}
      <div style={{ flex: 1, position: "relative", zIndex: 1, padding: "1.25rem 1rem 1.25rem 0.5rem" }}>
        <ClarityPanel />
      </div>

      {/* Floating label at top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.5 }}
        style={{
          position: "absolute",
          top: "0.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.3rem 0.75rem",
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 9999,
          backdropFilter: "blur(12px)",
          zIndex: 20,
          whiteSpace: "nowrap",
        }}
      >
        <Zap style={{ width: 10, height: 10, color: "#34d399" }} />
        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Chaos → Clarity in 3 seconds
        </span>
      </motion.div>

      {/* Floating stats bottom-right */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        style={{
          position: "absolute",
          bottom: "1rem",
          right: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
          zIndex: 20,
        }}
      >
        {[
          { label: "Sources ingested", value: "2.4k", color: "#60a5fa" },
          { label: "Conflicts flagged", value: "38", color: "#f87171" },
        ].map((item, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3 + i, delay: i * 1.5, ease: "easeInOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.65rem",
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 9999,
              backdropFilter: "blur(12px)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, boxShadow: `0 0 5px ${item.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>{item.value}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── No Black Boxes callout ──
function NoBlackBoxesCallout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.7 }}
      style={{
        margin: "0 auto",
        maxWidth: "80rem",
        padding: "0 2rem 3.5rem",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.25rem",
          background: "rgba(255,255,255,0.015)",
          backdropFilter: "blur(12px)",
          padding: "1.5rem 2rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        {/* Left: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield style={{ width: 16, height: 16, color: "#34d399" }} />
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#34d399", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
              Explainability Engine
            </span>
          </div>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            No Black Boxes.{" "}
            <span style={{ background: "linear-gradient(135deg, #34d399, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              100% Traceable AI.
            </span>
          </p>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif", maxWidth: "18rem", lineHeight: 1.6 }}>
            Every inference cites its source. See exactly why we flagged a conflict.
          </p>
        </div>

        {/* Right: confidence score cards */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {CONFIDENCE_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 + i * 0.15 }}
              style={{
                flex: 1,
                minWidth: 140,
                padding: "0.875rem 1rem",
                background: item.conflict ? "rgba(248,71,71,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${item.conflict ? "rgba(248,71,71,0.25)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "0.875rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif", marginBottom: "0.5rem", letterSpacing: "0.03em" }}>
                {item.label}
              </div>
              {/* Score bar */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 9999, marginBottom: "0.5rem", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ delay: 1.8 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                  style={{ height: "100%", background: item.color, borderRadius: 9999 }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: item.color, fontFamily: "Inter, sans-serif" }}>
                  {item.score}%
                </span>
                <span style={{ fontSize: "0.6rem", color: item.color, fontFamily: "Inter, sans-serif", fontWeight: 600, opacity: 0.85 }}>
                  {item.level}
                </span>
              </div>
              {item.conflict && (
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                  }}
                >
                  <AlertTriangle style={{ width: 9, height: 9, color: "#f87171" }} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.96]);
  const [inputValue, setInputValue] = useState("");

  const handleQuickTry = (prompt: string) => setInputValue(prompt);

  const childVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 75% 50%, rgba(82,218,196,0.06) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 65%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 65%, #000 100%)" }} />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* ── Two-column layout ── */}
      <motion.div
        className="relative z-10"
        style={{
          opacity: opacity as any,
          scale: scale as any,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          minHeight: "100vh",
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "6rem 2rem 8rem",
          gap: "3rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ── LEFT: Text content ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
        >
          {/* Label */}
          <motion.div variants={childVariants}>
            <div className="slash-label slash-label-accent" style={{ display: "inline-flex" }}>
              <span style={{ width: 5, height: 5, display: "inline-block", borderRadius: "50%", background: "hsl(var(--emerald))", boxShadow: "0 0 5px hsl(var(--emerald))" }} />
              AI-Powered Decision Intelligence
            </div>
          </motion.div>

          {/* ── NEW Headline ── */}
          <motion.h1
            variants={childVariants}
            className="font-display"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#fff",
            }}
          >
            Turn scattered{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              conversations
            </em>
            <br />
            into traceable{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                background: "linear-gradient(135deg, hsl(var(--violet)), #f87171)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              decisions.
            </em>
          </motion.h1>

          {/* ── NEW Subtitle ── */}
          <motion.p
            variants={childVariants}
            style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "-0.01em", lineHeight: 1.75, fontFamily: "'Inter', sans-serif", fontSize: "1rem", maxWidth: "28rem" }}
          >
            DecisionDNA connects your{" "}
            <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>Gmail, Docs & Meetings</span>{" "}
            to automatically map decision workflows, flag contradictory data, and deliver a{" "}
            <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>100% transparent audit trail</span>{" "}
            for your team.
          </motion.p>

          {/* ── Enhanced Search bar ── */}
          <motion.div variants={childVariants} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ position: "relative" }} className="group">
              <div
                className="absolute -inset-px rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, hsl(var(--teal)/0.4), hsl(var(--violet)/0.4))", filter: "blur(8px)" }}
              />
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "9999px",
                  backdropFilter: "blur(20px)",
                }}
              >
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--teal))" }} />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder='Try: "Analyze Q3 Board emails & Risk Docs on the APAC expansion..."'
                  style={{ flex: 1, background: "transparent", fontSize: "0.8125rem", color: "#fff", outline: "none", fontFamily: "'Inter', sans-serif", border: "none" }}
                  id="hero-search-input"
                />
                <button id="hero-analyze-btn" className="btn-primary btn-sm" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8125rem", flexShrink: 0 }}>
                  Analyze
                </button>
              </div>
            </div>

            {/* ── Quick Try pills ── */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingLeft: "0.25rem" }}>
              {QUICK_TRIES.map((qt, i) => (
                <motion.button
                  key={i}
                  id={`quick-try-${i}`}
                  onClick={() => handleQuickTry(qt.prompt)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  whileHover={{ scale: 1.04, borderColor: "rgba(82,218,196,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.75rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 9999,
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "Inter, sans-serif",
                    cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                >
                  <GitBranch style={{ width: 9, height: 9, opacity: 0.6 }} />
                  {qt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div variants={childVariants} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/canvas" id="hero-start-btn">
              <button className="btn-primary" style={{ padding: "0.875rem 2rem" }}>
                Start Building
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button
              className="btn-ghost"
              id="hero-demo-btn"
              style={{ padding: "0.875rem 1.75rem" }}
              onClick={() => document.getElementById("canvas")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Play className="w-4 h-4" style={{ fill: "currentColor" }} />
              Watch Demo
            </button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={childVariants}
            style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.22)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.02em" }}
          >
            Free during beta &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
          </motion.p>
        </motion.div>

        {/* ── RIGHT: Chaos → Clarity graphic ── */}
        <ChaosToClarityGraphic />
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.7 }}
        className="relative z-10"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 + i * 0.08 }}
              className="text-center"
            >
              <div className="font-display" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 600, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem", fontFamily: "'Inter', sans-serif" }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── No Black Boxes callout ── */}
      <NoBlackBoxesCallout />

      {/* Scroll indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ bottom: "1.5rem" }}
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      >
        <div style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)", margin: "0 auto" }} />
      </motion.div>
    </section>
  );
}
