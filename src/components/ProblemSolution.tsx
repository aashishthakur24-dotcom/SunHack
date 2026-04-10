import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { XCircle, CheckCircle, AlertTriangle } from "lucide-react";

const problems = [
  { icon: XCircle, text: "Decisions scattered across tools, docs, and emails", color: "hsl(340, 82%, 62%)" },
  { icon: AlertTriangle, text: "Conflicting data goes undetected until it's too late", color: "hsl(38, 92%, 60%)" },
  { icon: XCircle, text: "No audit trail for why a decision was made", color: "hsl(340, 82%, 62%)" },
];

const solutions = [
  { icon: CheckCircle, text: "Unified visual canvas for decision mapping", color: "hsl(152, 80%, 50%)" },
  { icon: CheckCircle, text: "AI-powered conflict detection in real-time", color: "hsl(174, 72%, 56%)" },
  { icon: CheckCircle, text: "Full timeline & source traceability", color: "hsl(252, 83%, 68%)" },
];

const MotionVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function ProblemSolution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad relative overflow-hidden" style={{ background: "#000" }}>
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(82,218,196,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="slash-label mb-5" style={{ display: "inline-flex" }}>The Problem & Solution</p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            From <em style={{ fontStyle: "italic", fontWeight: 300, color: "hsl(340, 82%, 62%)" }}>chaos</em> to{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>clarity</em>
          </h2>
          <p
            className="mt-4 max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}
          >
            Traditional decision-making is broken across every team, every tool. DecisionDNA fixes that.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-stretch">
          {/* Problems column */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(340, 82%, 62%)", boxShadow: "0 0 8px hsl(340, 82%, 62%)" }} />
              <span style={{ fontSize: "0.6875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(340, 82%, 62%)", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>The Problem</span>
            </div>
            <div className="space-y-3">
              {problems.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={MotionVariant}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="slash-card slash-glass-hover flex items-start gap-4 p-5"
                    style={{ borderRadius: "1rem" }}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: p.color }} />
                    <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.65)", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                      {p.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Solutions column */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(152, 80%, 50%)", boxShadow: "0 0 8px hsl(152, 80%, 50%)" }} />
              <span style={{ fontSize: "0.6875rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(152, 80%, 50%)", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>The Solution</span>
            </div>
            <div className="space-y-3">
              {solutions.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={i}
                    custom={i + 3}
                    variants={MotionVariant}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="slash-card slash-glass-hover flex items-start gap-4 p-5"
                    style={{ borderRadius: "1rem" }}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: s.color }} />
                    <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.65)", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                      {s.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Horizontal divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          className="slash-divider mt-20"
          style={{ transformOrigin: "left center" }}
        />
      </div>
    </section>
  );
}
