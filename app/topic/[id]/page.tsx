import { notFound } from 'next/navigation';
import { getTopic, getNodesByTopic } from '@/lib/supabase';
import { TopicContent } from '@/components/TopicContent';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  const topic = await getTopic(id);
  const nodes = await getNodesByTopic(id);

  if (!topic) {notFound();}

  return <TopicContent initialTopic={topic} initialNodes={nodes} />;
}