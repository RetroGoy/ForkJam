import { supabase } from './supabase';

export async function createNode({
  title,
  instrument,
  bpm,
  topic_id,
  parent_node_id,
  audio_url,
  user_id,
}: {
  title: string;
  instrument: string;
  bpm: number;
  topic_id: string;
  parent_node_id: string;
  audio_url: string;
  user_id: string;
}) {
  const { error } = await supabase.from('nodes').insert({
    title,
    instrument,
    bpm,
    topic_id,
    parent_node_id,
    audio_url,
    user_id,
  });

  if (error) {
    console.error('Error creating node:', error);
  }
}
