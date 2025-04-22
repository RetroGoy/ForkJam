import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
};

export type Topic = {
  id: string;
  title: string;
  description: string;
  created_at?: string;
  bpm: number;
};

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

export async function getNodesByTopic(topicId: string): Promise<Node[]> {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching nodes:', error);
    return [];
  }

  return data || [];
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