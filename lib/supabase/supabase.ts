import { createClient } from "@supabase/supabase-js";

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

export async function createNode(payload: Partial<Node>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payloadWithUser = {
    ...payload,
    user_id: user?.id ?? null,
    username: user?.user_metadata?.username ?? "Unknown",
  };

  const { data, error } = await supabase
    .from("nodes")
    .insert(payloadWithUser)
    .select()
    .single();

  if (error) {
    console.error("Error creating node:", error);
    return null;
  }

  return data as Node;
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

export async function toggleNodeVote(
  nodeId: string,
  value: 1 | -1
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", user.id)
    .eq("target_type", "node")
    .eq("target_id", nodeId)
    .maybeSingle();

  // remove vote if same value
  if (existing && existing.value === value) {
    await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", "node")
      .eq("target_id", nodeId);
    return;
  }

  // insert if no existing
  if (!existing) {
    await supabase.from("votes").insert({
      user_id: user.id,
      target_type: "node",
      target_id: nodeId,
      value,
    });
    return;
  }

  // update
  await supabase
    .from("votes")
    .update({ value })
    .eq("user_id", user.id)
    .eq("target_type", "node")
    .eq("target_id", nodeId);
}

// STORAGE

export async function uploadAudio(
  file: Blob,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("recordings")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: "audio/webm",
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