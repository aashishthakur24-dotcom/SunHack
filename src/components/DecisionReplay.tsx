import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface ReplayStep {
  time: string;
  label: string;
  detail: string;
  type: "info" | "safe" | "risk" | "conflict";
}

const steps: ReplayStep[] = [
  { time: "09:00", label: "Data Ingested", detail: "3 source documents uploaded and indexed", type: "info" },
  { time: "09:15", label: "Initial Analysis", detail: "AI extracted 14 key facts from revenue report", type: "info" },
  { time: "09:30", label: "Risk Flagged", detail: "Regulatory risk detected in APAC region", type: "risk" },
  { time: "09:45", label: "Conflict Found", detail: "Board notes contradict risk assessment on compliance", type: "conflict" },
  { time: "10:00", label: "Options Generated", detail: "3 decision pathways proposed with confidence scores", type: "info" },
  { time: "10:15", label: "Human Review", detail: "Analyst approved Option B with conditions", type: "safe" },
  { time: "10:30", label: "Decision Finalized", detail: "Proceed with APAC expansion, pending compliance", type: "safe" },
];

const typeColors: Record<string, string> = {
  info: "hsl(217, 91%, 60%)",
  safe: "hsl(152, 80%, 50%)",
  risk: "hsl(38, 92%, 60%)",
  conflict: "hsl(340, 82%, 62%)",
};

const typeLabels: Record<string, string> = {
  info: "Info",
  safe: "Complete",
  risk: "Risk",
  conflict: "Conflict",
};

export default function DecisionReplay() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [playing]);

  const progress = (currentStep / (steps.length - 1)) * 100;
  const current = steps[currentStep];

  return (
    <section ref={ref} className="section-pad relative" style={{ background: "#000" }}>
      {/* Violet radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 70% 50%, rgba(168,85,247,0.04) 0%, transparent 65%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p
            className="slash-label mb-5"
            style={{
              display: "inline-flex",
              background: "rgba(168,85,247,0.06)",
              borderColor: "rgba(168,85,247,0.2)",
              color: "hsl(252, 83%, 68%)",
            }}
          >
            Decision Replay
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            Replay the{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              decision journey
            </em>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="slash-card max-w-3xl mx-auto"
          style={{ padding: "2rem 2rem 1.75rem" }}
        >
          {/* Current step display */}
          <div style={{ minHeight: "80px", marginBottom: "2rem" }}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
            >
              {/* Type badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "9999px",
                  background: `${typeColors[current.type]}12`,
                  border: `1px solid ${typeColors[current.type]}30`,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: typeColors[current.type], display: "inline-block" }} />
                <span style={{ fontSize: "0.6875rem", color: typeColors[current.type], fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {typeLabels[current.type]}
                </span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.625rem", marginBottom: "0.375rem" }}>
                  <span style={{ fontSize: "0.6875rem", fontFamily: "'Inter', monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                    {current.time}
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>
                    {current.label}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                  {current.detail}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Progress bar */}
          <div style={{ position: "relative", marginBottom: "1.25rem" }}>
            <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", background: "linear-gradient(90deg, hsl(var(--teal)), hsl(var(--violet)))", borderRadius: 2 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            {/* Step markers */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-between",
                pointerEvents: "none",
              }}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: `1.5px solid ${typeColors[step.type]}`,
                    background: i <= currentStep ? typeColors[step.type] : "#000",
                    cursor: "pointer",
                    pointerEvents: "all",
                    transition: "transform 0.2s ease",
                    transform: i === currentStep ? "scale(1.4)" : "scale(1)",
                  }}
                  whileHover={{ scale: 1.3 }}
                />
              ))}
            </div>
          </div>

          {/* Time labels */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "1.25rem", paddingTop: "0.25rem" }}>
            {steps.map((step, i) => (
              <span
                key={i}
                style={{
                  fontSize: "0.5625rem",
                  fontFamily: "'Inter', monospace",
                  color: i === currentStep ? "hsl(var(--teal))" : "rgba(255,255,255,0.2)",
                  transition: "color 0.2s",
                  letterSpacing: "0.04em",
                }}
              >
                {step.time}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="slash-divider" style={{ marginBottom: "1.25rem" }} />

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              style={{
                padding: "0.625rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="hover:text-white hover:bg-white/8"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              id="replay-play-btn"
              onClick={() => {
                if (currentStep >= steps.length - 1) setCurrentStep(0);
                setPlaying(!playing);
              }}
              className="btn-primary"
              style={{ padding: "0.75rem", borderRadius: "0.875rem" }}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" style={{ fill: "currentColor" }} />}
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              style={{
                padding: "0.625rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="hover:text-white hover:bg-white/8"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
