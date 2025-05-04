// lib/uploadAudioToSupabase.ts
import { supabase } from './supabase';

export async function uploadAudioToSupabase(blob: Blob): Promise<string | null> {
  const filename  = `recordings/${Date.now()}.webm`;
  const { error } = await supabase
    .storage
    .from('recordings')
    .upload(filename, blob, { contentType: 'audio/webm' });   // <- important

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }
  const { data } = supabase.storage.from('recordings').getPublicUrl(filename);
  return data?.publicUrl ?? null;
}
