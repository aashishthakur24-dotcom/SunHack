import { useState, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Chrome, Github } from "lucide-react";

/* ── 3D Rotating Glass Shape ── */
function AuthShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.4;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={1.8}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          backside samples={6} thickness={0.5}
          chromaticAberration={0.3} anisotropy={0.5}
          distortion={0.3} distortionScale={0.4}
          iridescence={1.2} iridescenceIOR={1.3}
          iridescenceThicknessRange={[0, 1200]}
          color="#52dac4" roughness={0.05} transmission={0.96}
        />
      </mesh>
      <mesh scale={1.85}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#52dac4" wireframe transparent opacity={0.12} />
      </mesh>
    </Float>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const count = 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.015; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#a855f7" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ── Shared form input ── */
function AuthInput({ icon: Icon, type, placeholder, value, onChange, id, rightEl }: {
  icon: React.ElementType; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; id: string;
  rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: 12,
          background: focused ? "linear-gradient(135deg, hsl(174,72%,56%,0.5), hsl(252,83%,68%,0.4))" : "transparent",
          filter: "blur(4px)",
          transition: "all 0.3s ease",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.75rem 1rem",
          background: "rgba(255,255,255,0.035)",
          border: `1px solid ${focused ? "rgba(82,218,196,0.5)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 12,
          transition: "border-color 0.25s",
        }}
      >
        <Icon style={{ width: 16, height: 16, color: focused ? "hsl(174,72%,56%)" : "rgba(255,255,255,0.3)", transition: "color 0.25s", flexShrink: 0 }} />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
          }}
        />
        {rightEl}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   SIGN IN PAGE
───────────────────────────────────────── */
import { useAuth } from '@/hooks/useAuth';

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithGithub, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemo = () => {
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    try {
      setLoading(true);
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithub = async () => {
    try {
      setLoading(true);
      await signInWithGithub();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
      {/* ── LEFT: 3D Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3rem",
          background: "radial-gradient(ellipse 80% 80% at 40% 50%, rgba(82,218,196,0.06) 0%, rgba(168,85,247,0.05) 50%, transparent 80%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" fill="#000" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.03em" }}>DecisionDNA</span>
          </Link>
        </div>

        {/* 3D Scene */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.2} />
              <pointLight position={[4, 4, 4]} intensity={1.2} color="#52dac4" />
              <pointLight position={[-4, -4, 4]} intensity={0.8} color="#a855f7" />
              <AuthShape />
              <Particles />
              <Environment preset="night" />
            </Suspense>
          </Canvas>
        </div>

        {/* Quote at bottom */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <blockquote className="font-display" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.2, marginBottom: "1.25rem" }}>
            "Every great decision starts with{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(174,72%,56%), hsl(252,83%,68%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              clear thinking.
            </em>"
          </blockquote>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ label: "Decisions made", value: "142k+" }, { label: "Conflicts resolved", value: "38k+" }].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.03em" }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT: Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}
      >
        <div style={{ width: "100%", maxWidth: "22rem" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <h1 className="font-display" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", marginBottom: "0.5rem" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", marginBottom: "2rem" }}>
              Sign in to your DecisionDNA account
            </p>
          </motion.div>

          {/* OAuth buttons */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
{[
              { icon: Chrome, label: "Continue with Google", id: "google-signin", onClick: handleGoogle },
              { icon: Github, label: "Continue with GitHub", id: "github-signin", onClick: handleGithub },
            ].map((p, i) => (
              <button key={i} id={p.id} type="button"
                disabled={loading}
                onClick={p.onClick}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: "Inter, sans-serif", cursor: loading ? "default" : "pointer", transition: "all 0.2s", fontWeight: 500 }}
                onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)")}
                onMouseLeave={(e) => !loading && ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)")}
              >
                <p.icon style={{ width: 16, height: 16 }} />
                {p.label}
              </button>
            ))}
          </motion.div>

          {/* Divider */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </motion.div>

          {/* Form */}
          <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AuthInput icon={Mail} type="email" placeholder="you@company.com" value={email} onChange={setEmail} id="signin-email" />
            <AuthInput
              icon={Lock} type={showPass ? "text" : "password"} placeholder="Password" value={password} onChange={setPassword} id="signin-password"
              rightEl={
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.3)" }}>
                  {showPass ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              }
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link to="#" style={{ fontSize: "0.8125rem", color: "hsl(174,72%,56%)", fontFamily: "Inter, sans-serif", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 13, color: "#f87171", fontFamily: "Inter, sans-serif", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "8px 12px" }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              id="signin-submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-primary"
              style={{ padding: "0.875rem", fontSize: 15, fontWeight: 600, justifyContent: "center", marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Sign In <ArrowRight style={{ width: 15, height: 15 }} />
                </span>
              )}
            </motion.button>

            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif", marginTop: 4 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "hsl(174,72%,56%)", textDecoration: "none", fontWeight: 500 }}>
                Sign up
              </Link>
            </p>
          </motion.form>

          {/* Demo access */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
            style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: 14, border: "1px dashed rgba(82,218,196,0.25)", background: "rgba(82,218,196,0.04)" }}
          >
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif", textAlign: "center", marginBottom: "0.65rem", letterSpacing: "0.01em" }}>
              🎯 Just here to explore? No account needed.
            </p>
            <motion.button
              id="demo-access-btn"
              type="button"
              onClick={handleDemo}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "0.75rem",
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(82,218,196,0.15), rgba(168,85,247,0.12))",
                border: "1px solid rgba(82,218,196,0.3)",
                color: "hsl(174,72%,56%)",
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              ✨ Continue as Demo
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────
   REGISTER PAGE
───────────────────────────────────────── */
export function RegisterPage() {
  const navigate = useNavigate();
  const { register: signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    try {
      setLoading(true);
      await signUp(email, password, name);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
      {/* LEFT: 3D art panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3rem",
          background: "radial-gradient(ellipse 80% 80% at 40% 50%, rgba(168,85,247,0.07) 0%, rgba(82,218,196,0.05) 50%, transparent 80%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" fill="#000" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.03em" }}>DecisionDNA</span>
          </Link>
        </div>

        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.2} />
              <pointLight position={[4, 4, 4]} intensity={1} color="#a855f7" />
              <pointLight position={[-4, -4, 4]} intensity={0.7} color="#52dac4" />
              <AuthShape />
              <Particles />
              <Environment preset="night" />
            </Suspense>
          </Canvas>
        </div>

        <div style={{ position: "relative", zIndex: 10 }}>
          <h2 className="font-display" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.15, marginBottom: "1.25rem" }}>
            Start making decisions that{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(252,83%,68%), hsl(174,72%,56%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              matter.
            </em>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Full transparency on every AI recommendation", "Gmail, Meet & Docs integrations included", "Free during beta — no credit card needed"].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(82,218,196,0.15)", border: "1px solid rgba(82,218,196,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#52dac4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT: Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}
      >
        <div style={{ width: "100%", maxWidth: "22rem" }}>
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <h1 className="font-display" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", marginBottom: "0.5rem" }}>
                  Create account
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", marginBottom: "2rem" }}>
                  Join thousands of teams using DecisionDNA
                </p>

                {/* OAuth */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
                  {[
                    { icon: Chrome, label: "Continue with Google", id: "google-register", onClick: signInWithGoogle },
                    { icon: Github, label: "Continue with GitHub", id: "github-register", onClick: signInWithGithub },
                  ].map((p, i) => (
                    <button key={i} id={p.id}
                      type="button"
                      onClick={async () => {
                        setError("");
                        try {
                          setLoading(true);
                          await p.onClick();
                        } catch (err: any) {
                          setError(err.message || "OAuth sign-in failed");
                          setLoading(false);
                        }
                      }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: "Inter, sans-serif", cursor: "pointer", fontWeight: 500, transition: "all 0.2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                      disabled={loading}
                    >
                      <p.icon style={{ width: 16, height: 16 }} />
                      {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <AuthInput icon={Mail} type="text" placeholder="Full name" value={name} onChange={setName} id="register-name" />
                  <AuthInput icon={Mail} type="email" placeholder="Work email" value={email} onChange={setEmail} id="register-email" />
                  <AuthInput
                    icon={Lock} type={showPass ? "text" : "password"} placeholder="Password (min 8 chars)" value={password} onChange={setPassword} id="register-password"
                    rightEl={
                      <button type="button" onClick={() => setShowPass(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.3)" }}>
                        {showPass ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                      </button>
                    }
                  />

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length > i * 2 + 2 ? (password.length >= 12 ? "#34d399" : password.length >= 6 ? "#fbbf24" : "#f87171") : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ fontSize: 13, color: "#f87171", fontFamily: "Inter, sans-serif", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 10, padding: "8px 12px" }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}>
                    By creating an account you agree to our{" "}
                    <Link to="#" style={{ color: "hsl(174,72%,56%)", textDecoration: "none" }}>Terms</Link> and{" "}
                    <Link to="#" style={{ color: "hsl(174,72%,56%)", textDecoration: "none" }}>Privacy Policy</Link>.
                  </p>

                  <motion.button
                    type="submit"
                    id="register-submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="btn-primary"
                    style={{ padding: "0.875rem", fontSize: 15, fontWeight: 600, justifyContent: "center" }}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Creating account…
                      </span>
                    ) : "Create Account →"}
                  </motion.button>

                  <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
                    Already have an account?{" "}
                    <Link to="/signin" style={{ color: "hsl(174,72%,56%)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div key="verify" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }} style={{ textAlign: "center" }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  style={{ fontSize: "4rem", marginBottom: "1.5rem" }}
                >
                  📧
                </motion.div>
                <h2 className="font-display" style={{ fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", marginBottom: "0.75rem" }}>
                  Check your inbox
                </h2>
                <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", lineHeight: 1.7, marginBottom: "2rem" }}>
                  We sent a verification link to <strong style={{ color: "#fff" }}>{email}</strong>. Click it to activate your account.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: 15 }}
                >
                  Continue to Dashboard →
                </button>
                <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif" }}>
                  Didn't receive it?{" "}
                  <button style={{ background: "none", border: "none", color: "hsl(174,72%,56%)", cursor: "pointer", fontSize: "0.8125rem", fontFamily: "Inter, sans-serif", fontWeight: 500 }} onClick={() => {}}>
                    Resend email
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
