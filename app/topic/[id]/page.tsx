import { getTopic, getNodesByTopic } from '@/lib/supabase';
import { TopicContent } from '@/components/TopicContent';
import { notFound } from 'next/navigation';

interface TopicPageProps {
  params: { id: string };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const topic = await getTopic(params.id);
  const nodes = await getNodesByTopic(params.id);

  if (!topic) {
    return <div className="p-8 text-red-500">Topic not found.</div>;
  }

  return <TopicContent initialTopic={topic} initialNodes={nodes} />;
}