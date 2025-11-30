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

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type User = {
  id: string;
  username: string;
  email: string;
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

export type Topic = {
  id: string;
  title: string;
  description: string;
  created_at?: string;
  bpm: number;
};

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

  // Check existing vote
  const { data: existing } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_type', 'node')
    .eq('target_id', nodeId)
    .maybeSingle();

  // Case 1: same vote → remove
  if (existing && existing.value === newValue) {
    await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', 'node')
      .eq('target_id', nodeId);
    return;
  }

  // Case 2: no vote → insert
  if (!existing) {
    await supabase.from('votes').insert({
      user_id: user.id,
      target_type: 'node',
      target_id: nodeId,
      value: newValue,
    });
    return;
  }

  // Case 3: opposite vote → update
  await supabase
    .from('votes')
    .update({ value: newValue })
    .eq('user_id', user.id)
    .eq('target_type', 'node')
    .eq('target_id', nodeId);
}

export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  return data || [];
}

export async function getTopic(id: string): Promise<Topic | null> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching topic:', error);
    return null;
  }

  return data;
}

export async function getNodesByTopic(topicId: string) {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching nodes:', error);
    return [];
  }

  return data;
}

export type NodeWithUser = Node & {
  users?: {
    id: string;
    username: string;
    email: string;
  } | null;
};

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