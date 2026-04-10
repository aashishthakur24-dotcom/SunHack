import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import {
  Mail, Video, FileText, Zap, Shield, Bell, Key, User,
  Check, X, RefreshCw, ExternalLink, ChevronRight, AlertCircle, Settings
} from "lucide-react";

/* ─── Google integration state ─── */
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  connected: boolean;
  scopes: string[];
  lastSync?: string;
  email?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Automatically detect decision-relevant email threads, extract key facts, and surface conflicts from your inbox.",
    icon: Mail,
    color: "#ea4335",
    connected: true,
    scopes: ["Read emails", "Search by label", "Thread metadata"],
    lastSync: "2 minutes ago",
    email: "sam@company.com",
  },
  {
    id: "meet",
    name: "Google Meet",
    description: "Analyze meeting transcripts in real-time. Extract commitments, disagreements, and decision points from every call.",
    icon: Video,
    color: "#00897b",
    connected: true,
    scopes: ["Meeting transcripts", "Participant list", "Recording access"],
    lastSync: "1 hour ago",
    email: "sam@company.com",
  },
  {
    id: "docs",
    name: "Google Docs",
    description: "Parse documents, reports, and briefs from your Drive. Build a structured knowledge base across your entire document library.",
    icon: FileText,
    color: "#1a73e8",
    connected: false,
    scopes: ["Read documents", "Search Drive", "View spreadsheets"],
  },
];

const AI_MODELS = [
  { id: "gemini-pro", name: "Gemini 1.5 Pro", desc: "Best for complex reasoning tasks", badge: "Recommended" },
  { id: "gemini-flash", name: "Gemini 1.5 Flash", desc: "Faster, great for summaries", badge: "" },
  { id: "gpt4o", name: "GPT-4o", desc: "Requires OpenAI API key", badge: "" },
];

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!value)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: value ? "hsl(174,72%,56%)" : "rgba(255,255,255,0.12)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </motion.button>
  );
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.026)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "1.5rem",
      marginBottom: "0.875rem",
    }}>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const [notifications, setNotifications] = useState({ conflicts: true, suggestions: true, weekly: false });
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setConnecting(id);
    // Simulate OAuth flow
    await new Promise(r => setTimeout(r, 1800));
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: true, lastSync: "Just now", email: "sam@company.com" } : i));
    setConnecting(null);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false, lastSync: undefined, email: undefined } : i));
  };

  return (
    <PageLayout title="Settings" backTo="/dashboard" backLabel="Dashboard">
      <div style={{ maxWidth: "52rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, marginBottom: 8 }}>
            Settings
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif" }}>
            Manage your integrations, AI model, and preferences.
          </p>
        </div>

        {/* ── GOOGLE INTEGRATIONS ── */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Google Integrations
          </h2>
          {integrations.map((intg) => {
            const Icon = intg.icon;
            const isConnecting = connecting === intg.id;
            return (
              <SettingCard key={intg.id}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  {/* Icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${intg.color}14`, border: `1px solid ${intg.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 22, height: 22, color: intg.color }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "Inter,sans-serif", margin: 0 }}>{intg.name}</h3>
                      {intg.connected && (
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)", fontFamily: "Inter,sans-serif", fontWeight: 700 }}>
                          Connected
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif", lineHeight: 1.6, margin: "0 0 10px" }}>{intg.description}</p>

                    {/* Scopes */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: intg.connected ? 10 : 0 }}>
                      {intg.scopes.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "Inter,sans-serif" }}>
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Connected info */}
                    {intg.connected && (
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif" }}>
                        Signed in as <span style={{ color: "rgba(255,255,255,0.55)" }}>{intg.email}</span> · Last sync: {intg.lastSync}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    {intg.connected ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button
                          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "Inter,sans-serif" }}
                        >
                          <RefreshCw style={{ width: 11, height: 11 }} /> Sync now
                        </button>
                        <button
                          onClick={() => handleDisconnect(intg.id)}
                          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "Inter,sans-serif" }}
                        >
                          <X style={{ width: 11, height: 11 }} /> Disconnect
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => handleConnect(intg.id)}
                        animate={isConnecting ? { opacity: [1, 0.6, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="btn-primary"
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 16px" }}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <><RefreshCw style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Connecting…</>
                        ) : (
                          <><ExternalLink style={{ width: 12, height: 12 }} /> Connect</>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </SettingCard>
            );
          })}
        </div>

        {/* ── AI MODEL ── */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
            AI Model
          </h2>
          <SettingCard>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {AI_MODELS.map((model) => (
                <motion.div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  whileHover={{ background: "rgba(255,255,255,0.04)" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: selectedModel === model.id ? "rgba(82,218,196,0.06)" : "transparent",
                    border: selectedModel === model.id ? "1px solid rgba(82,218,196,0.2)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedModel === model.id ? "hsl(174,72%,56%)" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedModel === model.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(174,72%,56%)" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#fff", fontFamily: "Inter,sans-serif" }}>{model.name}</span>
                      {model.badge && (
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: "rgba(82,218,196,0.12)", color: "hsl(174,72%,56%)", border: "1px solid rgba(82,218,196,0.25)", fontFamily: "Inter,sans-serif", fontWeight: 700 }}>
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "Inter,sans-serif", marginTop: 2 }}>{model.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SettingCard>
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Notifications
          </h2>
          <SettingCard>
            {[
              { key: "conflicts", label: "Conflict alerts", desc: "Get notified when new conflicts are detected in your decisions" },
              { key: "suggestions", label: "AI suggestions", desc: "Receive AI-generated suggestions when you open a canvas" },
              { key: "weekly", label: "Weekly digest", desc: "Summary of all decisions and conflicts from the past week" },
            ].map((n, i) => (
              <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", fontFamily: "Inter,sans-serif", marginBottom: 2 }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "Inter,sans-serif" }}>{n.desc}</div>
                </div>
                <ToggleSwitch
                  value={notifications[n.key as keyof typeof notifications]}
                  onChange={(v) => setNotifications(prev => ({ ...prev, [n.key]: v }))}
                />
              </div>
            ))}
          </SettingCard>
        </div>

        {/* ── API KEY ── */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
            API Access
          </h2>
          <SettingCard>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <Key style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#fff", fontFamily: "Inter,sans-serif" }}>API Key</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                value="ddna_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Inter,monospace", outline: "none" }}
              />
              <button className="btn-ghost btn-sm">Reveal</button>
              <button className="btn-ghost btn-sm">Regenerate</button>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Inter,sans-serif", marginTop: 8, lineHeight: 1.6 }}>
              <AlertCircle style={{ width: 11, height: 11, display: "inline", marginRight: 4 }} />
              Keep your API key secret. Regenerating will invalidate the current key.
            </p>
          </SettingCard>
        </div>
      </div>
    </PageLayout>
  );
}
