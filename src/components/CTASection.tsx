import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";

const trust = [
  { icon: Zap, label: "Free during beta" },
  { icon: Shield, label: "No credit card" },
  { icon: Users, label: "Cancel anytime" },
];

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad relative overflow-hidden" style={{ background: "#000" }}>
      {/* Background gradient burst */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(82,218,196,0.05) 0%, rgba(168,85,247,0.04) 40%, transparent 70%)",
        }}
      />
      {/* Top divider */}
      <div className="slash-divider absolute top-0 left-0 right-0" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-8"
        >
          {/* Label */}
          <div className="flex justify-center">
            <div className="slash-label slash-label-accent">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "hsl(var(--emerald))", boxShadow: "0 0 5px hsl(var(--emerald))", display: "inline-block" }} />
              Early Access Open
            </div>
          </div>

          {/* Headline */}
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}
          >
            Ready to decode your{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              decisions?
            </em>
          </h2>

          {/* Sub */}
          <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif", lineHeight: 1.7, maxWidth: "32rem", margin: "0 auto" }}>
            Join the future of transparent, AI-powered decision intelligence. No black boxes. Full traceability.
          </p>

          {/* CTA button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/canvas" id="cta-canvas-btn">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
                style={{ padding: "1rem 2.5rem", fontSize: "1rem", fontWeight: 700 }}
              >
                Get Early Access
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <button
              className="btn-ghost"
              id="cta-demo-btn"
              style={{ padding: "1rem 2rem" }}
              onClick={() => document.getElementById("canvas")?.scrollIntoView({ behavior: "smooth" })}
            >
              See it in action
            </button>
          </div>

          {/* Trust items */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
            {trust.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
