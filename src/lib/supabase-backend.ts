import { type AuthChangeEvent, type Session, type User } from "@supabase/supabase-js";
import type { CanvasConnection, CanvasNode, Decision, Insight, UserProfile } from "@/types/app";
import { supabase } from "./supabase";

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

type AuthListener = (user: LocalUser | null) => void;
type DataListener<T> = (items: T[]) => void;

interface ProfileRow {
  uid: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DecisionRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  confidence: number;
  status: Decision["status"];
  created_at: string;
  updated_at: string;
}

interface CanvasNodeRow {
  id: string;
  user_id: string;
  label: string;
  type: CanvasNode["type"];
  node_type: CanvasNode["nodeType"];
  x: number;
  y: number;
  w: number;
  h: number;
  color: string | null;
  font_size: number | null;
  bold: boolean | null;
  italic: boolean | null;
  locked: boolean | null;
  visible: boolean | null;
  rotation: number | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

interface CanvasConnectionRow {
  id: string;
  user_id: string;
  from_node_id: string;
  to_node_id: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

interface InsightRow {
  id: string;
  user_id: string;
  type: Insight["type"];
  title: string;
  body: string;
  confidence: number;
  source_ids: string[];
  resolved: boolean;
  data: Insight["data"];
  created_at: string;
  updated_at: string;
}

interface SeedWorkspaceState {
  canvasNodes: Omit<CanvasNode, "id" | "createdAt" | "updatedAt">[];
  canvasConnections: Omit<CanvasConnection, "id" | "createdAt" | "updatedAt">[];
  insights: Omit<Insight, "id" | "createdAt" | "updatedAt">[];
}

const DEFAULT_SEED: SeedWorkspaceState = {
  canvasNodes: [
    { label: "Gmail: Risk Flag", type: "rect", nodeType: "risk", x: 80, y: 150, w: 160, h: 60, timestamp: "seed" },
    { label: "Revenue Report", type: "rect", nodeType: "info", x: 80, y: 280, w: 160, h: 60, timestamp: "seed" },
    { label: "Board Approval", type: "ellipse", nodeType: "safe", x: 320, y: 120, w: 160, h: 60, timestamp: "seed" },
    { label: "Compliance", type: "diamond", nodeType: "conflict", x: 300, y: 260, w: 180, h: 80, timestamp: "seed" },
    { label: "APAC Decision", type: "rect", nodeType: "decision", x: 580, y: 200, w: 180, h: 70, timestamp: "seed" },
  ],
  canvasConnections: [
    { from: "n1", to: "n3" },
    { from: "n1", to: "n4" },
    { from: "n2", to: "n3" },
    { from: "n2", to: "n5" },
    { from: "n3", to: "n5" },
    { from: "n4", to: "n5" },
  ],
  insights: [
    {
      type: "conflict",
      title: "Timeline Contradiction Detected",
      body: "Board memo approves Q4 launch while risk assessment mandates a 6-month compliance review.",
      confidence: 94,
      sourceIds: ["board-memo", "risk-assessment"],
      resolved: false,
      data: { score: 94 },
    },
    {
      type: "source",
      title: "Revenue Projection Alignment",
      body: "Multiple sources agree on the $2.4M revenue target for the current decision tree.",
      confidence: 91,
      sourceIds: ["q3-report", "cfo-email", "analyst-brief"],
      resolved: false,
      data: { score: 91 },
    },
    {
      type: "confidence",
      title: "Stakeholder Update Needed",
      body: "Legal review is still incomplete and is blocking the final approval step.",
      confidence: 78,
      sourceIds: ["legal-email", "compliance-doc"],
      resolved: false,
      data: { score: 78 },
    },
  ],
};

const authListeners = new Set<AuthListener>();
const dataListeners = new Map<string, Set<DataListener<any>>>();
let currentUser: LocalUser | null = null;
let authSubscriptionInitialized = false;
let authReady = false;

const toDate = (value: string | Date | undefined): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `supabase_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;

const mapSessionUser = (user: User | null): LocalUser | null => {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    (user.email ? user.email.split("@")[0] : "Anonymous");

  return {
    uid: user.id,
    email: user.email ?? "",
    displayName,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
  };
};

const emitAuthChange = () => {
  authListeners.forEach((listener) => listener(currentUser));
};

const emitDataChange = <T,>(key: string, items: T[]) => {
  const listeners = dataListeners.get(key);
  if (!listeners) return;
  listeners.forEach((listener) => listener(items));
};

const ensureAuthBridge = () => {
  if (authSubscriptionInitialized) return;
  authSubscriptionInitialized = true;

  void supabase.auth.getSession().then(({ data }) => {
    currentUser = mapSessionUser(data.session?.user ?? null);
    authReady = true;
    emitAuthChange();
  });

  supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    currentUser = mapSessionUser(session?.user ?? null);
    emitAuthChange();
  });
};

const mapProfile = (row: ProfileRow): UserProfile => ({
  uid: row.uid,
  name: row.name,
  email: row.email,
  createdAt: toDate(row.created_at),
});

const mapDecision = (row: DecisionRow): Decision => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  confidence: row.confidence,
  status: row.status,
  createdAt: toDate(row.created_at),
  updatedAt: toDate(row.updated_at),
});

const mapCanvasNode = (row: CanvasNodeRow): CanvasNode => ({
  id: row.id,
  label: row.label,
  type: row.type,
  nodeType: row.node_type,
  x: row.x,
  y: row.y,
  w: row.w,
  h: row.h,
  color: row.color ?? undefined,
  fontSize: row.font_size ?? undefined,
  bold: row.bold ?? undefined,
  italic: row.italic ?? undefined,
  locked: row.locked ?? undefined,
  visible: row.visible ?? undefined,
  rotation: row.rotation ?? undefined,
  timestamp: row.timestamp,
  createdAt: toDate(row.created_at),
  updatedAt: toDate(row.updated_at),
});

const mapCanvasConnection = (row: CanvasConnectionRow): CanvasConnection => ({
  id: row.id,
  from: row.from_node_id,
  to: row.to_node_id,
  label: row.label ?? undefined,
  createdAt: toDate(row.created_at),
  updatedAt: toDate(row.updated_at),
});

const mapInsight = (row: InsightRow): Insight => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  confidence: row.confidence,
  sourceIds: row.source_ids ?? [],
  resolved: row.resolved,
  data: row.data ?? {},
  createdAt: toDate(row.created_at),
  updatedAt: toDate(row.updated_at),
});

const apiError = (fallback: string, error: { message?: string } | null | undefined) => {
  if (!error?.message) return new Error(fallback);
  return new Error(error.message);
};

const fetchProfileRow = async (uid: string) => {
  const { data, error } = await supabase.from("profiles").select("uid,name,email,avatar_url,created_at,updated_at").eq("uid", uid).maybeSingle<ProfileRow>();
  if (error) throw apiError("Failed to load profile.", error);
  return data;
};

const hasSeededWorkspace = async (uid: string) => {
  const [decisions, nodes, connections, insights] = await Promise.all([
    supabase.from("decisions").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("canvas_nodes").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("canvas_connections").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("insights").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);

  const totalCount =
    (decisions.count ?? 0) +
    (nodes.count ?? 0) +
    (connections.count ?? 0) +
    (insights.count ?? 0);

  return totalCount > 0;
};

const seedWorkspace = async (uid: string) => {
  const alreadySeeded = await hasSeededWorkspace(uid);
  if (alreadySeeded) return;

  const now = new Date().toISOString();

  await Promise.all([
    supabase.from("canvas_nodes").insert(
      DEFAULT_SEED.canvasNodes.map((node, index) => ({
        id: `n${index + 1}`,
        user_id: uid,
        label: node.label,
        type: node.type,
        node_type: node.nodeType,
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        color: node.color ?? null,
        font_size: node.fontSize ?? null,
        bold: node.bold ?? null,
        italic: node.italic ?? null,
        locked: node.locked ?? null,
        visible: node.visible ?? null,
        rotation: node.rotation ?? null,
        timestamp: node.timestamp,
        created_at: now,
        updated_at: now,
      }))
    ),
    supabase.from("canvas_connections").insert(
      DEFAULT_SEED.canvasConnections.map((connection, index) => ({
        id: `c${index + 1}`,
        user_id: uid,
        from_node_id: connection.from,
        to_node_id: connection.to,
        label: connection.label ?? null,
        created_at: now,
        updated_at: now,
      }))
    ),
    supabase.from("insights").insert(
      DEFAULT_SEED.insights.map((insight, index) => ({
        id: `i${index + 1}`,
        user_id: uid,
        type: insight.type,
        title: insight.title,
        body: insight.body,
        confidence: insight.confidence,
        source_ids: insight.sourceIds,
        resolved: insight.resolved,
        data: insight.data,
        created_at: now,
        updated_at: now,
      }))
    ),
  ]);
};

const watchTable = <T,>(
  channelName: string,
  table: string,
  uid: string,
  callback: (items: T[]) => void,
  fetcher: () => Promise<T[]>
) => {
  void fetcher().then(callback);

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `user_id=eq.${uid}`,
      },
      async () => {
        callback(await fetcher());
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};

const fetchTableRows = async <TRow, TModel>(
  table: string,
  uid: string,
  mapper: (row: TRow) => TModel,
  orderBy: { column: string; ascending?: boolean } = { column: "created_at", ascending: true }
) => {
  const { data, error } = await supabase.from(table).select("*").eq("user_id", uid).order(orderBy.column, { ascending: orderBy.ascending ?? true });
  if (error) throw apiError(`Failed to load ${table}.`, error);
  return (data ?? []).map((row) => mapper(row as TRow));
};

const insertRow = async <TRow>(table: string, row: Record<string, unknown>) => {
  const { data, error } = await supabase.from(table).insert(row).select("id").single<TRow>();
  if (error) throw apiError(`Failed to create row in ${table}.`, error);
  return data;
};

const updateRow = async (table: string, id: string, uid: string, updates: Record<string, unknown>) => {
  const { error } = await supabase.from(table).update(updates).eq("id", id).eq("user_id", uid);
  if (error) throw apiError(`Failed to update row in ${table}.`, error);
};

const deleteRow = async (table: string, id: string, uid: string) => {
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", uid);
  if (error) throw apiError(`Failed to delete row in ${table}.`, error);
};

const deleteAllRows = async (table: string, uid: string) => {
  const { error } = await supabase.from(table).delete().eq("user_id", uid);
  if (error) throw apiError(`Failed to clear ${table}.`, error);
};

ensureAuthBridge();

export const authService = {
  onAuthChange(callback: AuthListener) {
    authListeners.add(callback);
    if (authReady) {
      callback(currentUser);
    }

    return () => {
      authListeners.delete(callback);
    };
  },

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw apiError("Sign in failed.", error);
  },

  async register(email: string, password: string, name: string): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name,
        },
      },
    });

    if (error) throw apiError("Registration failed.", error);
  },

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          import.meta.env.VITE_SUPABASE_REDIRECT_URL ??
          (typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined),
      },
    });

    if (error) throw apiError("Google sign-in failed.", error);
  },

  async signInWithGithub(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo:
          import.meta.env.VITE_SUPABASE_REDIRECT_URL ??
          (typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined),
      },
    });

    if (error) throw apiError("GitHub sign-in failed.", error);
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw apiError("Logout failed.", error);
    currentUser = null;
    emitAuthChange();
  },
};

export const profileService = {
  async getOrCreateProfile(user: LocalUser): Promise<UserProfile> {
    const existing = await fetchProfileRow(user.uid);
    const nextProfileRow: ProfileRow =
      existing ??
      ({
        uid: user.uid,
        name: user.displayName || "Anonymous",
        email: user.email,
        avatar_url: user.avatarUrl ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ProfileRow);

    const { error } = await supabase.from("profiles").upsert(
      {
        uid: user.uid,
        name: user.displayName || nextProfileRow.name || "Anonymous",
        email: user.email || nextProfileRow.email || "",
        avatar_url: user.avatarUrl ?? nextProfileRow.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "uid" }
    );

    if (error) throw apiError("Failed to sync profile.", error);

    await seedWorkspace(user.uid);

    const profile = await fetchProfileRow(user.uid);
    if (!profile) throw new Error("Profile was not created.");
    return mapProfile(profile);
  },
};

export const decisionService = {
  watchByUser(uid: string, callback: (decisions: Decision[]) => void) {
    return watchTable<Decision>(`decisions:${uid}`, "decisions", uid, callback, () => this.fetchByUser(uid));
  },

  async fetchByUser(uid: string): Promise<Decision[]> {
    return fetchTableRows<DecisionRow, Decision>("decisions", uid, mapDecision, { column: "created_at", ascending: true });
  },

  async create(uid: string, payload: Omit<Decision, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const row = await insertRow<DecisionRow>("decisions", {
      id: createId(),
      user_id: uid,
      title: payload.title,
      description: payload.description ?? null,
      confidence: payload.confidence,
      status: payload.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return row.id;
  },

  async update(uid: string, id: string, payload: Partial<Omit<Decision, "id" | "createdAt">>): Promise<void> {
    await updateRow("decisions", id, uid, {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.confidence !== undefined ? { confidence: payload.confidence } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      updated_at: new Date().toISOString(),
    });
  },

  async remove(uid: string, id: string): Promise<void> {
    await deleteRow("decisions", id, uid);
  },
};

export const canvasNodeService = {
  async fetchByUser(uid: string): Promise<CanvasNode[]> {
    return fetchTableRows<CanvasNodeRow, CanvasNode>("canvas_nodes", uid, mapCanvasNode, { column: "created_at", ascending: true });
  },

  watchByUser(uid: string, callback: (nodes: CanvasNode[]) => void) {
    return watchTable<CanvasNode>(`canvas_nodes:${uid}`, "canvas_nodes", uid, callback, () => this.fetchByUser(uid));
  },

  async create(uid: string, payload: Omit<CanvasNode, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const row = await insertRow<CanvasNodeRow>("canvas_nodes", {
      id: createId(),
      user_id: uid,
      label: payload.label,
      type: payload.type,
      node_type: payload.nodeType,
      x: payload.x,
      y: payload.y,
      w: payload.w,
      h: payload.h,
      color: payload.color ?? null,
      font_size: payload.fontSize ?? null,
      bold: payload.bold ?? null,
      italic: payload.italic ?? null,
      locked: payload.locked ?? null,
      visible: payload.visible ?? null,
      rotation: payload.rotation ?? null,
      timestamp: payload.timestamp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return row.id;
  },

  async update(uid: string, id: string, payload: Partial<Omit<CanvasNode, "id" | "createdAt">>): Promise<void> {
    await updateRow("canvas_nodes", id, uid, {
      ...(payload.label !== undefined ? { label: payload.label } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.nodeType !== undefined ? { node_type: payload.nodeType } : {}),
      ...(payload.x !== undefined ? { x: payload.x } : {}),
      ...(payload.y !== undefined ? { y: payload.y } : {}),
      ...(payload.w !== undefined ? { w: payload.w } : {}),
      ...(payload.h !== undefined ? { h: payload.h } : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
      ...(payload.fontSize !== undefined ? { font_size: payload.fontSize } : {}),
      ...(payload.bold !== undefined ? { bold: payload.bold } : {}),
      ...(payload.italic !== undefined ? { italic: payload.italic } : {}),
      ...(payload.locked !== undefined ? { locked: payload.locked } : {}),
      ...(payload.visible !== undefined ? { visible: payload.visible } : {}),
      ...(payload.rotation !== undefined ? { rotation: payload.rotation } : {}),
      ...(payload.timestamp !== undefined ? { timestamp: payload.timestamp } : {}),
      updated_at: new Date().toISOString(),
    });
  },

  async remove(uid: string, id: string): Promise<void> {
    await deleteRow("canvas_nodes", id, uid);
    const { error } = await supabase.from("canvas_connections").delete().eq("user_id", uid).or(`from_node_id.eq.${id},to_node_id.eq.${id}`);
    if (error) throw apiError("Failed to remove node connections.", error);
  },

  async replaceAll(uid: string, nodes: Array<Omit<CanvasNode, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    await deleteAllRows("canvas_nodes", uid);
    const now = new Date().toISOString();

    const { error } = await supabase.from("canvas_nodes").insert(
      nodes.map((node, index) => ({
        id: `n${index + 1}`,
        user_id: uid,
        label: node.label,
        type: node.type,
        node_type: node.nodeType,
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        color: node.color ?? null,
        font_size: node.fontSize ?? null,
        bold: node.bold ?? null,
        italic: node.italic ?? null,
        locked: node.locked ?? null,
        visible: node.visible ?? null,
        rotation: node.rotation ?? null,
        timestamp: node.timestamp,
        created_at: now,
        updated_at: now,
      }))
    );

    if (error) throw apiError("Failed to replace canvas nodes.", error);
  },
};

export const canvasConnectionService = {
  async fetchByUser(uid: string): Promise<CanvasConnection[]> {
    return fetchTableRows<CanvasConnectionRow, CanvasConnection>("canvas_connections", uid, mapCanvasConnection, { column: "created_at", ascending: true });
  },

  watchByUser(uid: string, callback: (connections: CanvasConnection[]) => void) {
    return watchTable<CanvasConnection>(`canvas_connections:${uid}`, "canvas_connections", uid, callback, () => this.fetchByUser(uid));
  },

  async create(uid: string, payload: Omit<CanvasConnection, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const row = await insertRow<CanvasConnectionRow>("canvas_connections", {
      id: createId(),
      user_id: uid,
      from_node_id: payload.from,
      to_node_id: payload.to,
      label: payload.label ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return row.id;
  },

  async update(uid: string, id: string, payload: Partial<Omit<CanvasConnection, "id" | "createdAt">>): Promise<void> {
    await updateRow("canvas_connections", id, uid, {
      ...(payload.from !== undefined ? { from_node_id: payload.from } : {}),
      ...(payload.to !== undefined ? { to_node_id: payload.to } : {}),
      ...(payload.label !== undefined ? { label: payload.label } : {}),
      updated_at: new Date().toISOString(),
    });
  },

  async remove(uid: string, id: string): Promise<void> {
    await deleteRow("canvas_connections", id, uid);
  },

  async replaceAll(uid: string, connections: Array<Omit<CanvasConnection, "id" | "createdAt" | "updatedAt">>): Promise<void> {
    await deleteAllRows("canvas_connections", uid);
    const now = new Date().toISOString();

    const { error } = await supabase.from("canvas_connections").insert(
      connections.map((connection, index) => ({
        id: `c${index + 1}`,
        user_id: uid,
        from_node_id: connection.from,
        to_node_id: connection.to,
        label: connection.label ?? null,
        created_at: now,
        updated_at: now,
      }))
    );

    if (error) throw apiError("Failed to replace canvas connections.", error);
  },
};

export const insightService = {
  async fetchByUser(uid: string): Promise<Insight[]> {
    return fetchTableRows<InsightRow, Insight>("insights", uid, mapInsight, { column: "created_at", ascending: false });
  },

  watchByUser(uid: string, callback: (insights: Insight[]) => void) {
    return watchTable<Insight>(`insights:${uid}`, "insights", uid, callback, () => this.fetchByUser(uid));
  },

  async create(uid: string, payload: Omit<Insight, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const row = await insertRow<InsightRow>("insights", {
      id: createId(),
      user_id: uid,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      confidence: payload.confidence,
      source_ids: payload.sourceIds,
      resolved: payload.resolved,
      data: payload.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return row.id;
  },

  async update(uid: string, id: string, payload: Partial<Omit<Insight, "id" | "createdAt">>): Promise<void> {
    await updateRow("insights", id, uid, {
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.body !== undefined ? { body: payload.body } : {}),
      ...(payload.confidence !== undefined ? { confidence: payload.confidence } : {}),
      ...(payload.sourceIds !== undefined ? { source_ids: payload.sourceIds } : {}),
      ...(payload.resolved !== undefined ? { resolved: payload.resolved } : {}),
      ...(payload.data !== undefined ? { data: payload.data } : {}),
      updated_at: new Date().toISOString(),
    });
  },

  async remove(uid: string, id: string): Promise<void> {
    await deleteRow("insights", id, uid);
  },
};
