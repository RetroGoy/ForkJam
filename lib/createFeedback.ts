import { supabase } from './supabase';

export async function createFeedback(input: {
  name: string;
  email?: string;
  message: string;
}) {
  const { error } = await supabase.from('feedbacks').insert({
    name: input.name,
    email: input.email,
    message: input.message,
  });

  if (error) throw error;
}
