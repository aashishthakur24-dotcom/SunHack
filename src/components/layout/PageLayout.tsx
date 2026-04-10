import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DnaMark from "@/components/DnaMark";

const GOLD   = "#C9A227";
const GOLD_L = "#F0C040";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  fullWidth?: boolean;
}

export default function PageLayout({
  children,
  title,
  backTo = "/",
  backLabel = "Home",
  actions,
  fullWidth = false,
}: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
      {/* ── Top bar ── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50, height: 56,
          display: "flex", alignItems: "center", padding: "0 1.5rem",
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(201,162,39,0.1)",
        }}
      >
        {/* Back */}
        <button
          onClick={() => navigate(backTo)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "rgba(255,255,255,0.42)", background: "transparent",
            border: "none", cursor: "pointer", fontSize: 13,
            fontFamily: "Inter, sans-serif", padding: "5px 9px", borderRadius: 8,
            transition: "color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = GOLD_L;
            (e.currentTarget as HTMLButtonElement).style.background = `${GOLD}0d`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.42)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          id="back-button"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          {backLabel}
        </button>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 12px" }} />

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#000", lineHeight: 0 }}>
              <DnaMark size={11} />
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}>DecisionDNA</span>
        </Link>

        {title && (
          <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 12px" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", fontFamily: "Inter, sans-serif" }}>{title}</span>
          </>
        )}

        <div style={{ flex: 1 }} />
        {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
      </header>

      {/* ── Content ── */}
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          flex: 1,
          maxWidth: fullWidth ? "100%" : "80rem",
          margin: "0 auto",
          padding: fullWidth ? 0 : "2rem 1.5rem 4rem",
          width: "100%",
        }}
      >
        {children}
      </motion.main>
    </div>
  );
}
