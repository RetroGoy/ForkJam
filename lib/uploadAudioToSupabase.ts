import { supabase } from "./supabase";

export async function uploadAudioToSupabase(blob: Blob) {
  const filePath = `recordings/${crypto.randomUUID()}.webm`;

  const { data, error } = await supabase.storage
    .from("recordings")
    .upload(filePath, blob, {
      upsert: false,
      contentType: "audio/webm",
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const publicUrl = supabase.storage
    .from("recordings")
    .getPublicUrl(filePath).data.publicUrl;

  return publicUrl;
}