import { createClient, type PostgrestError } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  }
);

// TYPES

export type User = {
  id: string;
  username: string;
  email: string;
  department: string | null;
};

// Modèle unique : un topic = un node avec parent_node_id=null et is_root=true
export type Node = {
  id: string;

  title: string;
  description: string | null;

  audio_url: string | null;
  instrument: string | null;

  parent_node_id: string | null;
  is_root: boolean;

  bpm: number | null;
  tag: string | null;
  location: number | null;

  note: number;
  created_at?: string;

  user_id: string | null; 
  username: string | null;
};

export type Vote = {
  id: string;

  title: string;
  description: string | null;

  audio_url: string | null;
  instrument: string | null;

  parent_node_id: string | null;
  is_root: boolean;

  bpm: number | null;
  tag: string | null;
  location: number | null;

  note: number;
  created_at?: string;

  user_id: string | null; 
  username: string | null;
};

// CREATE NODE (ROOT OR CHILD)

export async function createNode(
  payload: Partial<Node>
): Promise<{ data: Node | null; error: PostgrestError | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pseudo + département du créateur (affichés sur la carte du node).
  // Source primaire = user_metadata (toujours lisible, pas de RLS).
  // Secours = table users (nécessite une policy RLS "select own row").
  const meta = (user?.user_metadata ?? {}) as {
    username?: string;
    department?: string | number;
  };

  const toDep = (v: unknown): number | null => {
    if (v == null || String(v) === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  let username = meta.username || "Unknown";
  let location: number | null = toDep(meta.department) ?? payload.location ?? null;

  if (user && (username === "Unknown" || location == null)) {
    const { data: profile } = await supabase
      .from("users")
      .select("username, department")
      .eq("id", user.id)
      .maybeSingle();

    if (username === "Unknown" && profile?.username) username = profile.username;
    if (location == null) location = toDep(profile?.department);
  }

  const payloadWithUser = {
    ...payload,
    user_id: user?.id ?? null,
    username,
    location,
  };

  const { data, error } = await supabase
    .from("nodes")
    .insert(payloadWithUser)
    .select()
    .single();

  if (error) {
    console.error("Error creating node:", error);
    return { data: null, error };
  }

  return { data: data as Node, error: null };
}

// FETCH ROOT NODES

export async function getRootNodes(): Promise<Node[]> {
  const { data, error } = await supabase
    .from("nodes")
    .select("*")          
    .eq("is_root", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching root nodes:", error);
    return [];
  }

  return (data ?? []) as Node[];
}

// FETCH SINGLE NODE

export async function getNode(id: string) {
  const { data, error } = await supabase
    .from("nodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching node:", error);
    return null;
  }

  return data as Node;
}

export async function getChildren(parentId: string) {
  const { data, error } = await supabase
    .from("nodes")
    .select("*")
    .eq("parent_node_id", parentId)
    .order("created_at");

  if (error) {
    console.error("Error fetching children:", error);
    return [];
  }

  return data as Node[];
}

// FETCH FULL TREE (OPTIONAL)
// On pourra ajouter une RPC plus tard pour une version optimisée

// VOTES (UNIFIED – topic votes supprimés)

export async function getUserVoteForNode(nodeId: string): Promise<1 | -1 | 0> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("votes")
    .select("value")
    .eq("user_id", user.id)
    .eq("target_type", "node")
    .eq("target_id", nodeId)
    .maybeSingle();

  return data?.value ?? 0;
}

export type NodeVote = { target_id: string; value: number; user_id: string };

export async function getVotesForNodes(nodeIds: string[]): Promise<NodeVote[]> {
  if (nodeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("votes")
    .select("target_id, value, user_id")
    .eq("target_type", "node")
    .in("target_id", nodeIds);

  if (error) {
    console.error("Error fetching votes:", error);
    return [];
  }

  return (data ?? []) as NodeVote[];
}

// Note agrégée d'un topic = somme des votes de TOUS ses nodes (sous-arbre).
// Renvoie { rootId: score } pour les affichages de liste (Explore/Feed/Landing).
export async function getTopicScores(): Promise<Record<string, number>> {
  const [{ data: nodes }, { data: votes }] = await Promise.all([
    supabase.from("nodes").select("id, parent_node_id"),
    supabase.from("votes").select("target_id, value").eq("target_type", "node"),
  ]);

  if (!nodes) return {};

  const parent: Record<string, string | null> = {};
  for (const n of nodes as { id: string; parent_node_id: string | null }[]) {
    parent[n.id] = n.parent_node_id ?? null;
  }

  const rootOf = (id: string) => {
    let cur = id;
    let guard = 0;
    while (parent[cur] && guard++ < 1000) cur = parent[cur]!;
    return cur;
  };

  const scores: Record<string, number> = {};
  for (const v of (votes ?? []) as { target_id: string; value: number }[]) {
    const root = rootOf(v.target_id);
    scores[root] = (scores[root] ?? 0) + (v.value ?? 0);
  }
  return scores;
}

// Map chaque node -> l'id de son topic racine (pour lier vers /{root}).
export async function getRootIdMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from("nodes").select("id, parent_node_id");

  const parent: Record<string, string | null> = {};
  for (const n of (data ?? []) as { id: string; parent_node_id: string | null }[]) {
    parent[n.id] = n.parent_node_id ?? null;
  }

  const rootOf = (id: string) => {
    let cur = id;
    let guard = 0;
    while (parent[cur] && guard++ < 1000) cur = parent[cur]!;
    return cur;
  };

  const map: Record<string, string> = {};
  for (const id of Object.keys(parent)) map[id] = rootOf(id);
  return map;
}

export async function toggleNodeVote(
  nodeId: string,
  value: 1 | -1
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing } = await supabase
    .from("votes")
    .select("value")
    .eq("user_id", user.id)
    .eq("target_type", "node")
    .eq("target_id", nodeId)
    .maybeSingle();

  if (existing && existing.value === value) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", "node")
      .eq("target_id", nodeId);
    return !error;
  }

  if (!existing) {
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      target_type: "node",
      target_id: nodeId,
      value,
    });
    return !error;
  }

  const { error } = await supabase
    .from("votes")
    .update({ value })
    .eq("user_id", user.id)
    .eq("target_type", "node")
    .eq("target_id", nodeId);
  return !error;
}

// STORAGE

export async function uploadAudio(
  file: Blob,
  path: string,
  contentType = "audio/webm"
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("recordings")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (error) {
    console.error("Error uploading audio:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("recordings")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}