import { supabase } from "./supabase";

export async function createNode(nodeData: {
  title: string;
  instrument: string;
  audio_url: string;
  topic_id: string;
  parent_node_id: string | null;
  user_id: string | null;
}) {
  const { data, error } = await supabase
    .from("nodes")
    .insert(nodeData)
    .select()
    .single();

  if (error) {
    console.error("Error inserting node:", error);
    return null;
  }

  return data;
}