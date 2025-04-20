import { getTopics } from '@/lib/supabase';
import { HomeContent } from '@/components/HomeContent';

export default async function Home() {
  const topics = await getTopics();
  
  return <HomeContent initialTopics={topics} />;
}