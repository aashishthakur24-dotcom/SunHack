import { motion, useScroll } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Settings } from "lucide-react";
import DnaMark from "@/components/DnaMark";

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = isHome
    ? [
        { label: "Features", href: "#features" },
        { label: "Canvas", href: "#canvas" },
        { label: "Explainability", href: "#explainability" },
        { label: "Timeline", href: "#timeline" },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Canvas", href: "/canvas" },
        { label: "Agents", href: "/agents" },
        { label: "Insights", href: "/insights" },
        { label: "Settings", href: "/settings" },
      ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(0,0,0,0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 group-hover:bg-white/90 transition-colors">
            <div className="text-black">
              <DnaMark size={16} />
            </div>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Decision<span className="text-white/50">DNA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className={`px-4 py-2 text-sm transition-colors duration-200 rounded-full hover:bg-white/5 ${
                  location.pathname === link.href ? "text-white" : "text-white/50 hover:text-white"
                }`}
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/settings"
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/6 transition-all"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <Link to="/signin" className="btn-ghost btn-sm">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-primary btn-sm">
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="md:hidden border-t border-white/6 px-6 py-4 space-y-2"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}
        >
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="block px-4 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
          <div className="pt-2 flex gap-3">
            <Link to="/canvas" className="btn-primary btn-sm w-full justify-center">
              Open Canvas
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
