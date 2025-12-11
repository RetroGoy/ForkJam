import type { Metadata } from 'next';
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: 'ForkJam — Collaborative Music Graphs',
  description:
    'ForkJam est une plateforme musicale collaborative basée sur des graphes de riffs, de variations et d’enregistrements synchronisés.',
};
export default function Page() {
  return <LandingPage />;
}