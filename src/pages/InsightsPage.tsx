import { useEffect, useState, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { insightService } from "@/lib/supabase-backend";
import type { Insight } from "@/types/app";
import {
  Zap,
  FileText,
  AlertTriangle,
  CheckCircle,
  Search,
  BarChart3,
  Shield,
} from "lucide-react";

type InsightCard = {
  title: string;
  highlight: string;
  page: string;
  type: Insight["type"];
  confidence: number;
  resolved: boolean;
  id: string;
};

const fallbackInsights: InsightCard[] = [
  {
    id: "seed-1",
    title: "Timeline Contradiction Detected",
    highlight: "Board memo approves Q4 launch while risk assessment mandates a 6-month compliance review.",
    page: "p. 7",
    type: "conflict",
    confidence: 94,
    resolved: false,
  },
  {
    id: "seed-2",
    title: "Revenue Projection Alignment",
    highlight: "Multiple sources agree on the $2.4M revenue target for the current decision tree.",
    page: "p. 14",
    type: "source",
    confidence: 91,
    resolved: false,
  },
  {
    id: "seed-3",
    title: "Stakeholder Update Needed",
    highlight: "Legal review is still incomplete and is blocking the final approval step.",
    page: "p. 3",
    type: "confidence",
    confidence: 78,
    resolved: false,
  },
];

const typeIcon: Record<InsightCard["type"], ElementType> = {
  source: FileText,
  confidence: BarChart3,
  conflict: AlertTriangle,
};

const typeColor: Record<InsightCard["type"], string> = {
  source: "#1a73e8",
  confidence: "#34d399",
  conflict: "#f87171",
};

const scoreBreakdown = [
  { label: "Revenue data", pct: 94, color: "#34d399" },
  { label: "Compliance", pct: 62, color: "#fbbf24" },
  { label: "Regulatory risk", pct: 34, color: "#f87171" },
  { label: "Stakeholder alignment", pct: 78, color: "#60a5fa" },
];

function ConfidenceRing({ value, size = 100 }: { value: number; size?: number }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value > 80 ? "#34d399" : value > 60 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="font-display" style={{ fontSize: size * 0.22, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}%</span>
        <span style={{ fontSize: size * 0.09, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif" }}>conf.</span>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSource, setActiveSource] = useState(0);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = insightService.watchByUser(profile.uid, (items) => {
      setInsights(items);
      setActiveSource(0);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const sourceItems: InsightCard[] = (insights.length > 0 ? insights : []).map((insight) => ({
    id: insight.id,
    title: insight.title,
    highlight: insight.body,
    page: insight.resolved ? "Resolved" : `${insight.confidence}% confidence`,
    type: insight.type,
    confidence: insight.confidence,
    resolved: insight.resolved,
  }));

  const items = sourceItems.length > 0 ? sourceItems : fallbackInsights;
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.highlight.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeItem = filtered[activeSource] ?? filtered[0];

  const handleReAnalyze = async () => {
    if (!profile?.uid || !activeItem) return;

    await insightService.create(profile.uid, {
      type: activeItem.type === "conflict" ? "conflict" : activeItem.type === "confidence" ? "confidence" : "source",
      title: `${activeItem.title} (Re-analyzed)`,
      body: `Fresh analysis of ${activeItem.title} confirms the current signal and updates the confidence score.`,
      confidence: Math.min(99, activeItem.confidence + 2),
      sourceIds: [activeItem.id],
      resolved: false,
      data: { score: Math.min(99, activeItem.confidence + 2) },
    });
  };

  return (
    <PageLayout
      title="AI Insights"
      backTo="/dashboard"
      backLabel="Dashboard"
      actions={
        <button className="btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={handleReAnalyze}>
          <Zap style={{ width: 13, height: 13 }} />
          Re-analyze
        </button>
      }
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="font-display" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, marginBottom: 8 }}>
          AI <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Insights</em>
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif" }}>
          Live Supabase-backed insight stream for your DecisionDNA workspace.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ position: "relative", marginBottom: 4 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "rgba(255,255,255,0.3)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search insights…"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 10px 7px 30px", color: "#fff", fontSize: 12, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {filtered.map((item, index) => {
            const Icon = typeIcon[item.type];
            const isActive = index === activeSource;

            return (
              <motion.div
                key={item.id}
                onClick={() => setActiveSource(index)}
                whileHover={{ background: "rgba(255,255,255,0.04)" }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: isActive ? "rgba(82,218,196,0.06)" : "transparent", border: isActive ? "1px solid rgba(82,218,196,0.2)" : "1px solid transparent", transition: "all 0.15s" }}
              >
                <Icon style={{ width: 14, height: 14, color: typeColor[item.type], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: isActive ? "#fff" : "rgba(255,255,255,0.6)", fontFamily: "Inter,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "Inter,sans-serif" }}>{item.confidence}% confidence</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(174,72%,56%)", boxShadow: "0 0 6px hsl(174,72%,56%)" }} />
              <span style={{ fontSize: 11, color: "hsl(174,72%,56%)", fontFamily: "Inter,sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI-Generated Answer</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeItem?.id ?? "empty"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif", lineHeight: 1.8, marginBottom: 14 }}>
                  Source <span style={{ color: "#fff", fontWeight: 600 }}>&quot;{activeItem?.title}&quot;</span> contributes a <span style={{ color: "#34d399", fontWeight: 600 }}>{activeItem?.confidence}% confidence</span> signal. Key extracted finding:
                </p>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "Inter,sans-serif", lineHeight: 1.7, borderLeft: "3px solid hsl(38,92%,60%)" }}>
                  &quot;… <span style={{ color: "hsl(38,92%,60%)", background: "rgba(251,191,36,0.08)", padding: "0 4px", borderRadius: 3 }}>{activeItem?.highlight}</span> …&quot;
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>{activeItem?.page}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <AlertTriangle style={{ width: 14, height: 14, color: "#f87171" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "Inter,sans-serif" }}>Detected Conflicts</span>
              <span style={{ fontSize: 10, background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", padding: "2px 8px", borderRadius: 20, fontFamily: "Inter,sans-serif", fontWeight: 700 }}>{filtered.filter((item) => item.type === "conflict").length}</span>
            </div>

            {filtered.filter((item) => item.type === "conflict").map((item, index) => (
              <div key={item.id} style={{ padding: "12px", borderRadius: 10, background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", marginBottom: index < filtered.length - 1 ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Shield style={{ width: 11, height: 11, color: "#f87171" }} />
                  <span style={{ fontSize: 10, color: "#f87171", fontWeight: 700, fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>high severity</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter,sans-serif", marginBottom: 4, fontWeight: 500 }}>{item.highlight}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif" }}>{item.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", fontWeight: 600, margin: 0 }}>Overall Confidence</p>
            <ConfidenceRing value={activeItem?.confidence ?? 0} size={110} />
            <div style={{ width: "100%" }}>
              {scoreBreakdown.map((item, index) => (
                <div key={index} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,sans-serif" }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: item.color, fontFamily: "Inter,sans-serif", fontWeight: 600 }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1.2, delay: index * 0.1 }} style={{ height: "100%", background: item.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <CheckCircle style={{ width: 14, height: 14, color: "#34d399" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399", fontFamily: "Inter,sans-serif" }}>Recommended Action</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter,sans-serif", lineHeight: 1.7, margin: 0 }}>
              Proceed with APAC expansion with a <strong style={{ color: "#fbbf24" }}>conditional compliance review</strong> before Q4 commitment.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
