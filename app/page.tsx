// app/page.tsx
import { getRootNodes } from '@/lib/supabase/supabase';
import { HomeContent } from '@/components/HomeContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ForkJam — Collaborative Music Graphs',
  description:
    'ForkJam est une plateforme musicale collaborative basée sur des graphes de riffs, de variations et d’enregistrements synchronisés.',
};

export default async function Home() {
  const topics = await getRootNodes();
  return <HomeContent initialTopics={topics} />;
}