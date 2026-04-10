import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSolution from "@/components/ProblemSolution";
import FeyFeaturesSection from "@/components/FeyFeaturesSection";
import DecisionCanvas from "@/components/DecisionCanvas";
import AIPanel from "@/components/AIPanel";
import TimelineSection from "@/components/TimelineSection";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import ImpactSimulator from "@/components/ImpactSimulator";
import DecisionReplay from "@/components/DecisionReplay";
import UnstructuredDataEngine from "@/components/UnstructuredDataEngine";
import CTASection from "@/components/CTASection";
import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Decision Canvas", href: "/canvas" },
    { label: "AI Insights", href: "/insights" },
    { label: "Settings", href: "/settings" },
  ],
  Integrations: [
    { label: "Gmail", href: "/settings" },
    { label: "Google Meet", href: "/settings" },
    { label: "Google Docs", href: "/settings" },
    { label: "API Reference", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export default function Index() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />
      <ProblemSolution />

      {/* ── FEY-STYLE FEATURES WITH SCROLL ANIMATION ── */}
      <FeyFeaturesSection />

      <div id="canvas">
        <DecisionCanvas />
      </div>
      <div id="explainability">
        <AIPanel />
      </div>
      <ImpactSimulator />
      <UnstructuredDataEngine />
      <div id="timeline">
        <TimelineSection />
      </div>
      <DecisionReplay />
      <div id="graph">
        <KnowledgeGraph />
      </div>
      <CTASection />

      {/* ── FOOTER ── */}
      <footer style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "4rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, auto)", gap: "3rem", marginBottom: "3rem", alignItems: "start" }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" fill="#000" />
                    <circle cx="8" cy="8" r="2" fill="white" />
                  </svg>
                </div>
                <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}>
                  DecisionDNA
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif", lineHeight: 1.7, maxWidth: "20rem" }}>
                AI-powered decision intelligence for teams who need transparency, traceability, and real-time conflict detection.
              </p>
            </div>

            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <p style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: "1rem" }}>
                  {group}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {links.map((link) => (
                    link.href.startsWith("/") ? (
                      <Link
                        key={link.label}
                        to={link.href}
                        style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)"}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)"}
                      >
                        {link.label}
                      </a>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif" }}>
              © 2026 DecisionDNA. All rights reserved.
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {["Twitter", "LinkedIn", "GitHub"].map(s => (
                <a
                  key={s}
                  href="#"
                  style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.25)"}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
