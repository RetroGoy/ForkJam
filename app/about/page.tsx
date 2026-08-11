// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de ForkJam",
  description:
    "ForkJam est un projet indépendant mêlant musique, code et interfaces interactives, développé par un créateur passionné.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          À propos de ForkJam
        </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            ForkJam, c’est un projet qui permet à des musiciens de
            collaborer autrement. Le principe c’est que quelqu’un crée une
            idée musicale, d’autres peuvent venir ajouter leur propre piste, puis
            chacun peut repartir de n’importe quelle version pour créer une nouvelle
            branche. 
            Petit à petit, le morceau se construit sous la forme d’un graphe.
          </p>

          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            J’ai développé ForkJam avec Next.js, React, ReactFlow et Supabase, avec
            l’idée de mélanger musique, collaboration et interface visuelle. C’est
            encore un projet en évolution, que je fais grandir au fur et à mesure des idées et des usages.
          </p>
      </section>
    </main>
  );
}