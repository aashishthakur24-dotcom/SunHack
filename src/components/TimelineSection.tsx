import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  { time: "10:00", label: "Data Ingestion", desc: "3 documents parsed", accent: "hsl(217, 91%, 60%)" },
  { time: "10:05", label: "Entity Extraction", desc: "42 entities identified", accent: "hsl(174, 72%, 56%)" },
  { time: "10:12", label: "Cross-Reference", desc: "Sources compared", accent: "hsl(252, 83%, 68%)" },
  { time: "10:18", label: "Conflict Detection", desc: "1 conflict flagged", accent: "hsl(340, 82%, 62%)" },
  { time: "10:22", label: "Reasoning Chain", desc: "Decision path built", accent: "hsl(38, 92%, 60%)" },
  { time: "10:30", label: "Final Output", desc: "Recommendation ready", accent: "hsl(152, 80%, 50%)" },
];

export default function TimelineSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad relative overflow-hidden" style={{ background: "#000" }} id="timeline">
      {/* Radial teal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(82,218,196,0.03) 0%, transparent 65%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="slash-label slash-label-accent mb-5" style={{ display: "inline-flex" }}>Reasoning Timeline</p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            How AI{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              thinks
            </em>
          </h2>
        </motion.div>

        {/* Horizontal timeline */}
        <div className="relative">
          {/* Expanding line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
            style={{
              position: "absolute",
              top: "1.25rem",
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, hsl(var(--teal)/0.35), hsl(var(--violet)/0.35))",
              transformOrigin: "left center",
            }}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="relative text-center"
                style={{ paddingTop: "2.5rem" }}
              >
                {/* Step dot */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: step.accent,
                    boxShadow: `0 0 10px ${step.accent}60`,
                    border: "2px solid #000",
                  }}
                />

                {/* Card */}
                <div
                  className="slash-card slash-glass-hover"
                  style={{ padding: "1rem 0.75rem", borderRadius: "0.875rem" }}
                >
                  <span style={{ fontSize: "0.6875rem", fontFamily: "'Inter', monospace", color: step.accent, letterSpacing: "0.04em" }}>
                    {step.time}
                  </span>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", marginTop: "0.375rem", lineHeight: 1.3 }}>
                    {step.label}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", marginTop: "0.25rem" }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
