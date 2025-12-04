import { getRootNodes } from '@/lib/supabase/supabase';
import { HomeContent } from '@/components/HomeContent';

export default async function Home() {
  const topics = await getRootNodes(); 
  return <HomeContent initialTopics={topics} />;
}