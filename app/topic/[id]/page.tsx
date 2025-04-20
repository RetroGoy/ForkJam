import { getTopic, getNodesByTopic } from '@/lib/supabase';
import { TopicContent } from '@/components/TopicContent';
import { notFound } from 'next/navigation';

export default async function TopicPage({ params }: { params: { id: string } }) {
  const topic = await getTopic(params.id);
  
  if (!topic) {
    notFound();
  }
  
  const nodes = await getNodesByTopic(params.id);
  
  return <TopicContent initialTopic={topic} initialNodes={nodes} />;
}