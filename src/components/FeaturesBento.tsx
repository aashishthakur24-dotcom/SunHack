import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Shield, Clock, GitBranch, Search, BarChart3, Layers, Cpu } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Explainability",
    desc: "Every recommendation comes with a full audit trail — know exactly why the AI chose a path.",
    accent: "hsl(174, 72%, 56%)",
    size: "col-span-2",
    bg: "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(82,218,196,0.07) 0%, transparent 70%)",
  },
  {
    icon: Shield,
    title: "Conflict Detection",
    desc: "Real-time scanning across all sources to surface contradictions before they become problems.",
    accent: "hsl(340, 82%, 62%)",
    size: "",
    bg: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(248,113,113,0.06) 0%, transparent 70%)",
  },
  {
    icon: Clock,
    title: "Decision Timeline",
    desc: "Full chronological replay of how every decision evolved.",
    accent: "hsl(252, 83%, 68%)",
    size: "",
    bg: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 70%)",
  },
  {
    icon: GitBranch,
    title: "Impact Simulation",
    desc: "Model what-if scenarios and propagate risk across your entire decision graph instantly.",
    accent: "hsl(38, 92%, 60%)",
    size: "",
    bg: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 70%)",
  },
  {
    icon: Search,
    title: "Unstructured Data Engine",
    desc: "Parse emails, PDFs, and meeting notes into structured, queryable intelligence automatically.",
    accent: "hsl(217, 91%, 60%)",
    size: "col-span-2",
    bg: "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(96,165,250,0.06) 0%, transparent 70%)",
  },
  {
    icon: BarChart3,
    title: "Confidence Scores",
    desc: "Quantified certainty on every recommendation with source-level breakdown.",
    accent: "hsl(152, 80%, 50%)",
    size: "",
    bg: "radial-gradient(ellipse 80% 80% at 30% 60%, rgba(52,211,153,0.06) 0%, transparent 70%)",
  },
  {
    icon: Layers,
    title: "Source Attribution",
    desc: "Every fact is traced to its origin document, page, and timestamp. No black boxes.",
    accent: "hsl(174, 72%, 56%)",
    size: "",
    bg: "radial-gradient(ellipse 80% 80% at 50% 30%, rgba(82,218,196,0.05) 0%, transparent 70%)",
  },
  {
    icon: Cpu,
    title: "Real-time Processing",
    desc: "Sub-second analysis on documents and decisions as they change.",
    accent: "hsl(252, 83%, 68%)",
    size: "",
    bg: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 70%)",
  },
];

export default function FeaturesBento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad relative" style={{ background: "#000" }}>
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="slash-label slash-label-accent mb-5" style={{ display: "inline-flex" }}>
            Everything you need
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            Built for{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              serious decisions
            </em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "1rem", fontFamily: "'Inter', sans-serif", maxWidth: "36rem", margin: "1rem auto 0" }}>
            Every feature is designed to make complex reasoning transparent, auditable, and actionable.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
          }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isWide = feature.size === "col-span-2";

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="slash-card slash-glass-hover"
                style={{
                  gridColumn: isWide ? "span 2" : "span 1",
                  padding: "1.75rem",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: "160px",
                  cursor: "default",
                }}
              >
                {/* Background radial */}
                <div
                  style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
                  dangerouslySetInnerHTML={{
                    __html: `<div style="position:absolute;inset:0;background:${feature.bg}"></div>`,
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "0.75rem",
                      background: `${feature.accent}14`,
                      border: `1px solid ${feature.accent}25`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.accent }} />
                  </div>

                  {/* Text */}
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.7,
                      maxWidth: "28rem",
                    }}
                  >
                    {feature.desc}
                  </p>

                  {/* Tag accent corner */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 60,
                      height: 60,
                      background: `radial-gradient(circle, ${feature.accent}18, transparent 70%)`,
                      borderRadius: "0 1rem 0 0",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
