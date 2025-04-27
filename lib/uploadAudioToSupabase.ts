import { supabase } from './supabase';

export async function uploadAudioToSupabase(blob: Blob): Promise<string | null> {
  const filename = `recordings/${Date.now()}.webm`;
  const { data, error } = await supabase.storage.from('recordings').upload(filename, blob);

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from('recordings').getPublicUrl(filename);
  return publicUrlData?.publicUrl || null;
}
