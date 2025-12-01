import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      fetch: (...args) => fetch(...args)
    }
  }
);

// -------------------- TYPES --------------------

export type User = {
  id: string;
  username: string;
  email: string;
  department: string | null;
};

export type Topic = {
  id: string;
  title: string;
  description: string;
  created_at?: string;
  bpm: number;
  style?: string;
  user_id?: string;
  note?: number;
  users?: User | null;
};

export type Node = {
  id: string;
  title: string;
  audio_url: string;
  instrument: string;
  created_at?: string;
  user_id: string;
  topic_id: string;
  parent_node_id: string | null;
  note?: number;
};

export type NodeWithUser = Node & {
  users?: {
    id: string;
    username: string;
    email: string;
  } | null;
};

// -------------------- TOPICS --------------------

export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select(`
      id,
      title,
      description,
      style,
      bpm,
      created_at,
      user_id,
      note,
      users:users (
        id,
        username,
        email,
        department
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching topics:", error);
    return [];
  }

  return (data ?? []) as unknown as Topic[];
}

export async function getTopic(id: string): Promise<Topic | null> {
  const { data, error } = await supabase
    .from("topics")
    .select(`
      id,
      title,
      description,
      style,
      bpm,
      created_at,
      user_id,
      note,
      users:users (
        id,
        username,
        email,
        department
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching topic:", error);
    return null;
  }

  return (data ?? null) as unknown as Topic | null;
}

// -------------------- NODES --------------------

export async function getNodesByTopic(topicId: string) {
  const { data, error } = await supabase
    .from('nodes')
    .select(`
      *,
      users:users(id, username, email)
    `)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching nodes:', error);
    return [];
  }

  return data;
}

export async function createNode(node: Omit<Node, 'id' | 'created_at'>): Promise<Node | null> {
  const { data, error } = await supabase
    .from('nodes')
    .insert(node)
    .select()
    .single();

  if (error) {
    console.error('Error creating node:', error);
    return null;
  }

  return data;
}

// -------------------- VOTES --------------------

export async function getUserVoteForNode(nodeId: string): Promise<1 | -1 | 0> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from('votes')
    .select('value')
    .eq('user_id', user.id)
    .eq('target_type', 'node')
    .eq('target_id', nodeId)
    .maybeSingle();

  return data?.value ?? 0;
}

export async function toggleNodeVote(nodeId: string, newValue: 1 | -1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_type', 'node')
    .eq('target_id', nodeId)
    .maybeSingle();

  if (existing && existing.value === newValue) {
    await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', 'node')
      .eq('target_id', nodeId);
    return;
  }

  if (!existing) {
    await supabase.from('votes').insert({
      user_id: user.id,
      target_type: 'node',
      target_id: nodeId,
      value: newValue,
    });
    return;
  }

  await supabase
    .from('votes')
    .update({ value: newValue })
    .eq('user_id', user.id)
    .eq('target_type', 'node')
    .eq('target_id', nodeId);
}

export async function getUserVoteForTopic(topicId: string): Promise<1 | -1 | 0> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("votes")
    .select("value")
    .eq("user_id", user.id)
    .eq("target_type", "topic")
    .eq("target_id", topicId)
    .maybeSingle();

  return data?.value ?? 0;
}

export async function toggleTopicVote(topicId: string, newValue: 1 | -1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", user.id)
    .eq("target_type", "topic")
    .eq("target_id", topicId)
    .maybeSingle();

  if (existing && existing.value === newValue) {
    await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", "topic")
      .eq("target_id", topicId);
    return;
  }

  if (!existing) {
    await supabase.from("votes").insert({
      user_id: user.id,
      target_type: "topic",
      target_id: topicId,
      value: newValue,
    });
    return;
  }

  await supabase
    .from("votes")
    .update({ value: newValue })
    .eq("user_id", user.id)
    .eq("target_type", "topic")
    .eq("target_id", topicId);
}

// -------------------- STORAGE --------------------

export async function uploadAudio(file: Blob, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'audio/webm',
    });

  if (error) {
    console.error('Error uploading audio:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('recordings')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}