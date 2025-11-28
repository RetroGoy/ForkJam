import { getTopics } from '@/lib/supabase';
import { HomeContent } from '@/components/HomeContent';

export default async function Home() {
  const topics = await getTopics();
  console.log("SERVER SUPABASE URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SERVER SUPABASE KEY =", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  return <HomeContent initialTopics={topics} />;
}