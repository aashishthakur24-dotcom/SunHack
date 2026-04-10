import { useState, useCallback, useRef, useEffect, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { canvasConnectionService, canvasNodeService } from "@/lib/supabase-backend";
import {
  MousePointer2, Pencil, Square, Circle, Diamond, Triangle,
  Type, Minus, Trash2, Save, Share2, ZoomIn, ZoomOut, RotateCcw,
  Redo2, Download, Layers, Zap, Plus, FileText, Mail, Video,
  AlignCenter, Bold, Italic, Palette, Copy, Lock, Unlock, Eye,
  ChevronDown, MoreHorizontal, StickyNote, Move, Link2
} from "lucide-react";

/* ─── Types ─── */
type Tool = "select" | "draw" | "rect" | "ellipse" | "diamond" | "triangle" | "text" | "line" | "arrow" | "sticky" | "connector";
type NodeType = "safe" | "risk" | "conflict" | "info" | "decision";

interface CanvasNode {
  id: string;
  type: "rect" | "ellipse" | "diamond" | "triangle" | "text" | "sticky";
  x: number; y: number;
  w: number; h: number;
  label: string;
  nodeType: NodeType;
  color?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  locked?: boolean;
  visible?: boolean;
  rotation?: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface DrawPath {
  id: string;
  points: [number, number][];
  color: string;
  width: number;
}

const NODE_COLORS: Record<NodeType, string> = {
  safe: "#34d399", risk: "#fbbf24", conflict: "#f87171", info: "#60a5fa", decision: "#52dac4",
};

const STICKY_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c"];

const INITIAL_NODES: CanvasNode[] = [
  { id: "n1", type: "rect", x: 80, y: 150, w: 160, h: 60, label: "Gmail: Risk Flag", nodeType: "risk" },
  { id: "n2", type: "rect", x: 80, y: 280, w: 160, h: 60, label: "Revenue Report", nodeType: "info" },
  { id: "n3", type: "ellipse", x: 320, y: 120, w: 160, h: 60, label: "Board Approval", nodeType: "safe" },
  { id: "n4", type: "diamond", x: 300, y: 260, w: 180, h: 80, label: "Compliance", nodeType: "conflict" },
  { id: "n5", type: "rect", x: 580, y: 200, w: 180, h: 70, label: "APAC Decision", nodeType: "decision" },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "c1", from: "n1", to: "n3" }, { id: "c2", from: "n1", to: "n4" },
  { id: "c3", from: "n2", to: "n3" }, { id: "c4", from: "n2", to: "n5" },
  { id: "c5", from: "n3", to: "n5" }, { id: "c6", from: "n4", to: "n5" },
];

/* ─── utils ─── */
let idCounter = 100;
const uid = () => `node_${++idCounter}`;

/** Get anchor point at center of node bbox */
function nodeCenter(n: CanvasNode): [number, number] {
  return [n.x + n.w / 2, n.y + n.h / 2];
}

/** Draw a node shape path on canvas context */
function drawShape(ctx: CanvasRenderingContext2D, n: CanvasNode) {
  const { x, y, w, h, type } = n;
  ctx.beginPath();
  if (type === "rect" || type === "sticky") {
    const r = 10;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else if (type === "ellipse") {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (type === "diamond") {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
  } else if (type === "triangle") {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  }
  ctx.closePath();
}

/* ─── Component ─── */
export default function CanvasPage() {
  const { profile } = useAuth();
  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<[number, number][] | null>(null);
  const [drawColor, setDrawColor] = useState("#52dac4");
  const [drawWidth, setDrawWidth] = useState(2);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"properties" | "layers" | "sources">("properties");
  const [showColors, setShowColors] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<CanvasNode[][]>([INITIAL_NODES]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeNodeType, setActiveNodeType] = useState<NodeType>("info");

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      if (!profile?.uid) return;

      const [remoteNodes, remoteConnections] = await Promise.all([
        canvasNodeService.fetchByUser(profile.uid),
        canvasConnectionService.fetchByUser(profile.uid),
      ]);

      if (cancelled) return;

      if (remoteNodes.length > 0) {
        setNodes(remoteNodes as CanvasNode[]);
        setHistory([remoteNodes as CanvasNode[]]);
        setHistoryIdx(0);
      }

      if (remoteConnections.length > 0) {
        setConnections(remoteConnections.map((connection) => ({ id: connection.id, from: connection.from, to: connection.to, label: connection.label })));
      }
    };

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [profile?.uid]);

  // Push to history
  const pushHistory = (newNodes: CanvasNode[]) => {
    const sliced = history.slice(0, historyIdx + 1);
    setHistory([...sliced, newNodes]);
    setHistoryIdx(sliced.length);
  };

  const undo = () => {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    setHistoryIdx(idx);
    setNodes(history[idx]);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    setHistoryIdx(idx);
    setNodes(history[idx]);
  };

  // Zoom with scroll
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom(z => Math.max(0.25, Math.min(4, z + delta)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || e.key === "Z")) { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          const newNodes = nodes.filter(n => !selectedIds.has(n.id));
          setNodes(newNodes);
          setConnections(cs => cs.filter(c => !selectedIds.has(c.from) && !selectedIds.has(c.to)));
          pushHistory(newNodes);
          setSelectedIds(new Set());
        }
      }
      if (e.key === "v") setTool("select");
      if (e.key === "r") setTool("rect");
      if (e.key === "e") setTool("ellipse");
      if (e.key === "d") setTool("draw");
      if (e.key === "t") setTool("text");
      if (e.key === "Escape") { setSelectedIds(new Set()); setConnecting(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, nodes, historyIdx, history]);

  // get viewport coords from event
  const vp = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const vpRaw = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /* ─── Mouse events ─── */
  const handleCanvasDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      const raw = vpRaw(e);
      setPanStart({ x: raw.x, y: raw.y, panX: pan.x, panY: pan.y });
      return;
    }
    if (tool === "draw") {
      const p = vp(e);
      setCurrentPath([[p.x, p.y]]);
      return;
    }
    if (tool !== "select") {
      const p = vp(e);
      const shapeType: CanvasNode["type"] =
        tool === "rect" ? "rect"
        : tool === "ellipse" ? "ellipse"
        : tool === "diamond" ? "diamond"
        : tool === "triangle" ? "triangle"
        : tool === "text" ? "text"
        : tool === "sticky" ? "sticky"
        : "rect";
      const newNode: CanvasNode = {
        id: uid(), type: shapeType,
        x: p.x - 80, y: p.y - 30,
        w: tool === "text" ? 160 : tool === "sticky" ? 140 : 160,
        h: tool === "text" ? 40 : tool === "sticky" ? 120 : 60,
        label: tool === "text" ? "Text" : tool === "sticky" ? "Note…" : "New node",
        nodeType: activeNodeType,
        color: tool === "sticky" ? STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)] : undefined,
      };
      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      pushHistory(newNodes);
      setSelectedIds(new Set([newNode.id]));
      setTool("select");
      return;
    }
    // select tool – click on empty space
    setSelectedIds(new Set());
    setConnecting(null);
  };

  const handleCanvasMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const raw = vpRaw(e);
      setPan({
        x: panStart.panX + (raw.x - panStart.x),
        y: panStart.panY + (raw.y - panStart.y),
      });
      return;
    }
    if (dragging) {
      const p = vp(e);
      setNodes(prev => prev.map(n => n.id === dragging
        ? { ...n, x: p.x - dragOffset.x, y: p.y - dragOffset.y }
        : n
      ));
      return;
    }
    if (tool === "draw" && currentPath) {
      const p = vp(e);
      setCurrentPath(prev => prev ? [...prev, [p.x, p.y]] : null);
      return;
    }
  };

  const handleCanvasUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    setDragging(null);
    if (tool === "draw" && currentPath && currentPath.length > 2) {
      setDrawPaths(prev => [...prev, { id: uid(), points: currentPath, color: drawColor, width: drawWidth }]);
    }
    setCurrentPath(null);
  };

  const handleNodeDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id)!;
    if (node.locked) return;

    if (connecting) {
      // Complete connection
      if (connecting !== id) {
        const newConn: Connection = { id: uid(), from: connecting, to: id };
        setConnections(prev => [...prev, newConn]);
      }
      setConnecting(null);
      return;
    }

    if (e.detail === 2) {
      // Double click → edit text
      setEditingId(id);
      setEditText(node.label);
      return;
    }

    setSelectedIds(new Set([id]));
    const p = vp(e);
    setDragOffset({ x: p.x - node.x, y: p.y - node.y });
    setDragging(id);
  };

  const finishEdit = () => {
    if (editingId) {
      const newNodes = nodes.map(n => n.id === editingId ? { ...n, label: editText } : n);
      setNodes(newNodes);
      pushHistory(newNodes);
    }
    setEditingId(null);
  };

  const getSelectedNode = () => selectedIds.size === 1 ? nodes.find(n => n.id === [...selectedIds][0]) : undefined;
  const selectedNode = getSelectedNode();

  const updateSelected = (patch: Partial<CanvasNode>) => {
    const newNodes = nodes.map(n => selectedIds.has(n.id) ? { ...n, ...patch } : n);
    setNodes(newNodes);
    pushHistory(newNodes);
  };

  const deleteSelected = () => {
    const newNodes = nodes.filter(n => !selectedIds.has(n.id));
    setNodes(newNodes);
    setConnections(cs => cs.filter(c => !selectedIds.has(c.from) && !selectedIds.has(c.to)));
    pushHistory(newNodes);
    setSelectedIds(new Set());
  };

  const duplicateSelected = () => {
    const copies = nodes.filter(n => selectedIds.has(n.id)).map(n => ({ ...n, id: uid(), x: n.x + 24, y: n.y + 24 }));
    const newNodes = [...nodes, ...copies];
    setNodes(newNodes);
    pushHistory(newNodes);
    setSelectedIds(new Set(copies.map(c => c.id)));
  };

  const handleSave = async () => {
    if (!profile?.uid) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    await Promise.all([
      canvasNodeService.replaceAll(profile.uid, nodes),
      canvasConnectionService.replaceAll(profile.uid, connections),
    ]);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ─── Edge path between two nodes ─── */
  const edgePath = (conn: Connection) => {
    const from = nodes.find(n => n.id === conn.from);
    const to = nodes.find(n => n.id === conn.to);
    if (!from || !to) return null;
    const [x1, y1] = nodeCenter(from);
    const [x2, y2] = nodeCenter(to);
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} Q${mx},${y1} ${mx},${(y1 + y2) / 2} Q${mx},${y2} ${x2},${y2}`;
  };

  /* ─── Tools ─── */
  const leftTools = [
    { id: "select", icon: MousePointer2, label: "Select (V)" },
    { id: "draw", icon: Pencil, label: "Draw (D)" },
    null,
    { id: "rect", icon: Square, label: "Rectangle (R)" },
    { id: "ellipse", icon: Circle, label: "Ellipse (E)" },
    { id: "diamond", icon: Diamond, label: "Diamond" },
    { id: "triangle", icon: Triangle, label: "Triangle" },
    { id: "sticky", icon: StickyNote, label: "Sticky Note" },
    null,
    { id: "text", icon: Type, label: "Text (T)" },
    { id: "connector", icon: Link2, label: "Connector" },
  ] as const;

  const NODE_TYPE_COLORS: [NodeType, string][] = [
    ["info", "#60a5fa"], ["safe", "#34d399"], ["risk", "#fbbf24"], ["conflict", "#f87171"], ["decision", "#52dac4"],
  ];

  return (
    <PageLayout
      title="Decision Canvas"
      backTo="/dashboard"
      backLabel="Dashboard"
      fullWidth
      actions={
        <>
          <button onClick={undo} className="btn-ghost btn-sm" title="Undo (⌘Z)" style={{ padding: "6px 8px" }}><RotateCcw style={{ width: 13, height: 13 }} /></button>
          <button onClick={redo} className="btn-ghost btn-sm" title="Redo" style={{ padding: "6px 8px" }}><Redo2 style={{ width: 13, height: 13 }} /></button>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
          <button className="btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}><Share2 style={{ width: 13, height: 13 }} /> Share</button>
          <button className="btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}><Download style={{ width: 13, height: 13 }} /> Export</button>
          <button onClick={handleSave} className={saved ? "btn-ghost btn-sm" : "btn-primary btn-sm"} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Save style={{ width: 13, height: 13 }} />{saved ? "Saved ✓" : "Save"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
        {/* ── LEFT TOOLBAR ── */}
        <div style={{ width: 52, background: "rgba(255,255,255,0.015)", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 2, overflowY: "auto", flexShrink: 0 }}>
          {leftTools.map((t, i) => {
            if (!t) return <div key={i} style={{ width: 36, height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />;
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTool(t.id as Tool)}
                title={t.label}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                  boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.15)" : "none",
                }}
              >
                <Icon style={{ width: 16, height: 16 }} />
              </motion.button>
            );
          })}

          <div style={{ flex: 1 }} />

          {/* Zoom controls */}
          {[
            { icon: ZoomIn, label: "Zoom In", action: () => setZoom(z => Math.min(4, z + 0.2)) },
            { icon: ZoomOut, label: "Zoom Out", action: () => setZoom(z => Math.max(0.25, z - 0.2)) },
          ].map((b, i) => (
            <motion.button key={i} whileHover={{ scale: 1.08 }} onClick={b.action} title={b.label}
              style={{ width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "rgba(255,255,255,0.35)", marginBottom: 2 }}
            >
              <b.icon style={{ width: 14, height: 14 }} />
            </motion.button>
          ))}
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "Inter,monospace", marginBottom: 8 }}>{Math.round(zoom * 100)}%</div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            cursor: tool === "draw" ? "crosshair"
              : tool === "select" || tool === "connector" ? "default"
              : isPanning ? "grabbing"
              : "crosshair",
            background: "#000",
          }}
          onMouseDown={handleCanvasDown}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasUp}
          onMouseLeave={handleCanvasUp}
        >
          {/* Dot grid */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="dot-grid" x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)} width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                <circle cx={1} cy={1} r={0.7} fill="rgba(255,255,255,0.07)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid)" />
          </svg>

          {/* Transformed container */}
          <div style={{ position: "absolute", inset: 0, transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            <svg
              ref={svgRef}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.3)" />
                </marker>
              </defs>
              {/* Draw paths */}
              {drawPaths.map(path => (
                <polyline key={path.id} points={path.points.map(p => p.join(",")).join(" ")} fill="none" stroke={path.color} strokeWidth={path.width} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {currentPath && (
                <polyline points={currentPath.map(p => p.join(",")).join(" ")} fill="none" stroke={drawColor} strokeWidth={drawWidth} strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* Connection edges */}
              {connections.map(conn => {
                const path = edgePath(conn);
                if (!path) return null;
                return (
                  <g key={conn.id}>
                    <path d={path} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                    <path d={path} fill="none" stroke="rgba(82,218,196,0.35)" strokeWidth="1" strokeDasharray="8 5" markerEnd="url(#arrowhead)" />
                  </g>
                );
              })}
              {/* Selection rect */}
              {[...selectedIds].map(id => {
                const n = nodes.find(nd => nd.id === id);
                if (!n) return null;
                return <rect key={`sel-${id}`} x={n.x - 4} y={n.y - 4} width={n.w + 8} height={n.h + 8} rx={14} fill="none" stroke="hsl(174,72%,56%)" strokeWidth="1.5" strokeDasharray="5 3" />;
              })}
            </svg>

            {/* Nodes */}
            {nodes.filter(n => n.visible !== false).map(node => {
              const isSelected = selectedIds.has(node.id);
              const nColor = node.color ?? NODE_COLORS[node.nodeType];

              return (
                <motion.div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: node.w,
                    height: node.h,
                    cursor: node.locked ? "not-allowed" : dragging === node.id ? "grabbing" : "grab",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => handleNodeDown(e, node.id)}
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Shape background */}
                  <svg width={node.w} height={node.h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {node.type === "ellipse" ? (
                      <ellipse cx={node.w / 2} cy={node.h / 2} rx={node.w / 2 - 1} ry={node.h / 2 - 1}
                        fill={`${nColor}12`} stroke={nColor} strokeWidth={isSelected ? 2 : 1} />
                    ) : node.type === "diamond" ? (
                      <polygon points={`${node.w / 2},1 ${node.w - 1},${node.h / 2} ${node.w / 2},${node.h - 1} 1,${node.h / 2}`}
                        fill={`${nColor}12`} stroke={nColor} strokeWidth={isSelected ? 2 : 1} />
                    ) : node.type === "triangle" ? (
                      <polygon points={`${node.w / 2},1 ${node.w - 1},${node.h - 1} 1,${node.h - 1}`}
                        fill={`${nColor}12`} stroke={nColor} strokeWidth={isSelected ? 2 : 1} />
                    ) : node.type === "sticky" ? (
                      <rect x={0} y={0} width={node.w} height={node.h} rx={8}
                        fill={`${nColor}22`} stroke={nColor} strokeWidth={isSelected ? 2 : 1} />
                    ) : (
                      <rect x={0} y={0} width={node.w} height={node.h} rx={10}
                        fill={`${nColor}12`} stroke={nColor} strokeWidth={isSelected ? 2 : 1} />
                    )}
                  </svg>

                  {/* Label / edit */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px" }}>
                    {editingId === node.id ? (
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={finishEdit}
                        onKeyDown={e => { if (e.key === "Enter") finishEdit(); if (e.key === "Escape") setEditingId(null); }}
                        style={{
                          background: "transparent", border: "none", outline: "none",
                          color: "#fff", fontFamily: "Inter, sans-serif",
                          fontSize: node.fontSize || 12, fontWeight: node.bold ? 700 : 500,
                          fontStyle: node.italic ? "italic" : "normal",
                          textAlign: "center", width: "100%",
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{
                        fontSize: node.fontSize || (node.type === "text" ? 14 : 12),
                        fontWeight: node.bold ? 700 : 500,
                        fontStyle: node.italic ? "italic" : "normal",
                        color: "#fff",
                        fontFamily: "Inter, sans-serif",
                        textAlign: "center",
                        lineHeight: 1.3,
                        pointerEvents: "none",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as any,
                      }}>
                        {node.label}
                      </span>
                    )}
                  </div>

                  {/* Lock icon */}
                  {node.locked && <Lock style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, color: "rgba(255,255,255,0.4)", pointerEvents: "none" } as any} />}

                  {/* Connector trigger */}
                  {isSelected && !node.locked && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ position: "absolute", top: "50%", right: -14, transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: "hsl(174,72%,56%)", border: "2px solid #000", cursor: "crosshair", zIndex: 10 }}
                      onMouseDown={(e) => { e.stopPropagation(); setConnecting(node.id); setTool("connector"); }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Zoom badge */}
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9999 }}>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.2))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1 }}>−</button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter,monospace", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.2))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1 }}>+</button>
            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)" }} />
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "Inter,sans-serif" }}>Reset</button>
          </div>

          {/* Node type palette */}
          <div style={{ position: "absolute", bottom: 16, left: 70, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9999 }}>
            {NODE_TYPE_COLORS.map(([type, color]) => (
              <button key={type} onClick={() => setActiveNodeType(type)} title={type}
                style={{ width: 16, height: 16, borderRadius: "50%", background: color, border: activeNodeType === type ? `2px solid #fff` : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }}
              />
            ))}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", marginLeft: 4 }}>{activeNodeType}</span>
          </div>

          {/* Draw options (when draw tool active) */}
          {tool === "draw" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif" }}>Color:</span>
              {["#52dac4", "#f87171", "#fbbf24", "#60a5fa", "#34d399", "#a78bfa", "#fff"].map(c => (
                <button key={c} onClick={() => setDrawColor(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: drawColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
              ))}
              <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif" }}>Width:</span>
              {[1, 2, 4, 8].map(w => (
                <button key={w} onClick={() => setDrawWidth(w)} style={{ width: w === 1 ? 20 : w === 2 ? 22 : w === 4 ? 24 : 28, height: w + 12, minHeight: 14, borderRadius: 4, background: drawWidth === w ? "#fff" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer" }} />
              ))}
            </motion.div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ width: 240, background: "rgba(255,255,255,0.015)", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {(["properties", "layers", "sources"] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                style={{ flex: 1, padding: "10px 0", fontSize: 11, fontFamily: "Inter,sans-serif", fontWeight: sidebarTab === tab ? 600 : 400, color: sidebarTab === tab ? "#fff" : "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", borderBottom: sidebarTab === tab ? "2px solid hsl(174,72%,56%)" : "2px solid transparent", textTransform: "capitalize", letterSpacing: "0.04em" }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Properties tab */}
          {sidebarTab === "properties" && (
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {selectedNode ? (
                <>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input value={selectedNode.label} onChange={e => updateSelected({ label: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Node Type</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {NODE_TYPE_COLORS.map(([type, color]) => (
                        <button key={type} onClick={() => updateSelected({ nodeType: type })}
                          style={{ padding: "3px 8px", borderRadius: 20, background: selectedNode.nodeType === type ? `${color}20` : "transparent", border: `1px solid ${color}50`, color, fontSize: 10, fontFamily: "Inter,sans-serif", cursor: "pointer" }}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Size</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[["W", "w"], ["H", "h"]].map(([name, key]) => (
                        <div key={key}>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", marginBottom: 3 }}>{name}</div>
                          <input type="number" value={(selectedNode as any)[key]} onChange={e => updateSelected({ [key]: +e.target.value })} style={{ ...inputStyle, textAlign: "center" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Text Style</label>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => updateSelected({ bold: !selectedNode.bold })} style={{ ...styleBtn, background: selectedNode.bold ? "rgba(255,255,255,0.1)" : "transparent" }}>
                        <Bold style={{ width: 12, height: 12 }} />
                      </button>
                      <button onClick={() => updateSelected({ italic: !selectedNode.italic })} style={{ ...styleBtn, background: selectedNode.italic ? "rgba(255,255,255,0.1)" : "transparent" }}>
                        <Italic style={{ width: 12, height: 12 }} />
                      </button>
                      {[10, 12, 14, 16, 20].map(size => (
                        <button key={size} onClick={() => updateSelected({ fontSize: size })} style={{ ...styleBtn, fontSize: 9, background: selectedNode.fontSize === size ? "rgba(255,255,255,0.1)" : "transparent", minWidth: 24 }}>{size}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Actions</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <button onClick={duplicateSelected} style={actionBtn}><Copy style={{ width: 12, height: 12 }} /> Duplicate</button>
                      <button onClick={() => updateSelected({ locked: !selectedNode.locked })} style={actionBtn}>{selectedNode.locked ? <><Unlock style={{ width: 12, height: 12 }} /> Unlock</> : <><Lock style={{ width: 12, height: 12 }} /> Lock</>}</button>
                      <button onClick={() => updateSelected({ visible: selectedNode.visible === false ? true : false })} style={actionBtn}><Eye style={{ width: 12, height: 12 }} /> {selectedNode.visible === false ? "Show" : "Hide"}</button>
                      <button onClick={deleteSelected} style={{ ...actionBtn, color: "#f87171", borderColor: "rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.05)" }}><Trash2 style={{ width: 12, height: 12 }} /> Delete</button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", paddingTop: "2rem" }}>
                  <MousePointer2 style={{ width: 24, height: 24, color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>
                    Select a node to edit its properties.<br />Double-click to edit text.
                  </p>
                </div>
              )}

              {/* AI analyze */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: 12 }}>
                  <Zap style={{ width: 12, height: 12 }} /> AI Analyze Canvas
                </button>
                <div style={{ marginTop: 10, padding: "10px", borderRadius: 10, background: "rgba(82,218,196,0.04)", border: "1px solid rgba(82,218,196,0.12)" }}>
                  <div style={{ fontSize: 11, color: "hsl(174,72%,56%)", fontFamily: "Inter,sans-serif", fontWeight: 600, marginBottom: 4 }}>Last Analysis</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif", lineHeight: 1.6 }}>2 conflicts detected. APAC risk path flagged.</div>
                </div>
              </div>
            </div>
          )}

          {/* Layers tab */}
          {sidebarTab === "layers" && (
            <div style={{ padding: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={labelStyle}>Layers ({nodes.length})</span>
                <button onClick={() => {
                  const newNode: CanvasNode = { id: uid(), type: "rect", x: 160, y: 160, w: 160, h: 60, label: "New Node", nodeType: "info" };
                  const newNodes = [...nodes, newNode];
                  setNodes(newNodes);
                  pushHistory(newNodes);
                }} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(174,72%,56%)" }}>
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
              </div>
              {[...nodes].reverse().map(n => (
                <div key={n.id} onClick={() => setSelectedIds(new Set([n.id]))}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, cursor: "pointer", background: selectedIds.has(n.id) ? "rgba(82,218,196,0.08)" : "transparent", border: selectedIds.has(n.id) ? "1px solid rgba(82,218,196,0.2)" : "1px solid transparent", marginBottom: 2, transition: "all 0.15s" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: NODE_COLORS[n.nodeType], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.label}</span>
                  {n.locked && <Lock style={{ width: 10, height: 10, color: "rgba(255,255,255,0.3)" }} />}
                  {n.visible === false && <Eye style={{ width: 10, height: 10, color: "rgba(255,255,255,0.15)" }} />}
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", marginBottom: "0.5rem" }}>Connections ({connections.length})</div>
                {connections.map(c => {
                  const from = nodes.find(n => n.id === c.from);
                  const to = nodes.find(n => n.id === c.to);
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Minus style={{ width: 10, height: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {from?.label?.slice(0, 12) ?? "?"} → {to?.label?.slice(0, 12) ?? "?"}
                      </span>
                      <button onClick={() => setConnections(cs => cs.filter(x => x.id !== c.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.4)", marginLeft: "auto", flexShrink: 0 }}>
                        <Trash2 style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources tab */}
          {sidebarTab === "sources" && (
            <div style={{ padding: "0.75rem" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", marginBottom: "0.875rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Connected Sources</div>
              {[
                { label: "Gmail Threads", icon: Mail, color: "#ea4335", count: 3, connected: true },
                { label: "Google Docs", icon: FileText, color: "#1a73e8", count: 2, connected: true },
                { label: "Meet Transcripts", icon: Video, color: "#00897b", count: 1, connected: true },
              ].map((src, i) => {
                const Icon = src.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <Icon style={{ width: 14, height: 14, color: src.color }} />
                    <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "Inter,sans-serif" }}>{src.label}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "Inter,sans-serif" }}>{src.count}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1rem", paddingTop: "1rem" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", marginBottom: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Canvas Stats</div>
                {[
                  { label: "Nodes", value: nodes.length },
                  { label: "Connections", value: connections.length },
                  { label: "Draw paths", value: drawPaths.length },
                  { label: "Conflicts", value: nodes.filter(n => n.nodeType === "conflict").length },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif" }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Inter,sans-serif" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

/* ─── Inline styles ─── */
const labelStyle: React.CSSProperties = { fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter,sans-serif", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 13, fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box" };
const styleBtn: React.CSSProperties = { padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.09)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const actionBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter,sans-serif", cursor: "pointer", transition: "all 0.15s", width: "100%" };
