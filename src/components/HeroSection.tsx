import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import HeroScene from "./HeroScene";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "10×", label: "Faster decisions" },
  { value: "97%", label: "Accuracy rate" },
  { value: "3s", label: "Avg analysis time" },
  { value: "500+", label: "Teams onboarded" },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.96]);
  const [inputValue, setInputValue] = useState("");

  const childVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
    >
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
          gap: "2rem",
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

          {/* Headline */}
          <motion.h1
            variants={childVariants}
            className="font-display"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#fff",
            }}
          >
            Build with a{" "}
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
              thinking
            </em>
            <br />
            system.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={childVariants}
            style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em", lineHeight: 1.75, fontFamily: "'Inter', sans-serif", fontSize: "1.0625rem", maxWidth: "26rem" }}
          >
            Decode complexity. Visualize reasoning. Make decisions that are
            transparent, traceable, and conflict-aware.
          </motion.p>

          {/* Search bar */}
          <motion.div variants={childVariants} style={{ position: "relative" }} className="group">
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
                placeholder="Describe your decision challenge…"
                style={{ flex: 1, background: "transparent", fontSize: "0.875rem", color: "#fff", outline: "none", fontFamily: "'Inter', sans-serif", border: "none" }}
                id="hero-search-input"
              />
              <button id="hero-analyze-btn" className="btn-primary btn-sm" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8125rem", flexShrink: 0 }}>
                Analyze
              </button>
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

        {/* ── RIGHT: Isolated 3D Scene ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.0, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: "relative",
            height: "clamp(420px, 55vh, 680px)",
            borderRadius: "2rem",
            overflow: "hidden",
          }}
        >
          {/* Glow ring behind cube */}
          <div
            style={{
              position: "absolute",
              inset: "10%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(82,218,196,0.12), rgba(168,85,247,0.1) 60%, transparent 100%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
            <HeroScene isolated />
          </div>

          {/* Floating info cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              zIndex: 10,
            }}
          >
            {[
              { label: "Conflicts resolved", value: "38", color: "#34d399" },
              { label: "Sources analyzed", value: "2.4k", color: "#60a5fa" },
            ].map((item, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 3 + i, delay: i * 1.5, ease: "easeInOut" }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.875rem",
                  background: "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "9999px",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
                <span style={{ fontSize: "0.75rem", fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                <span style={{ fontSize: "0.75rem", fontFamily: "Inter, sans-serif", fontWeight: 700, color: "#fff" }}>{item.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.7 }}
        className="absolute bottom-0 left-0 right-0 z-10"
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

      {/* Scroll indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ bottom: "7rem" }}
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      >
        <div style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)", margin: "0 auto" }} />
      </motion.div>
    </section>
  );
}
