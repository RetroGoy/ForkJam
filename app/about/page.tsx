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
        <p className="max-w-3xl text-sm text-neutral-300 sm:text-base">
          ForkJam est développé par un créateur passionné de musique, de code
          et d’interfaces interactives. L’idée est simple : proposer un outil
          qui mélange créativité musicale et exploration visuelle, en
          permettant à chacun de collaborer à travers des graphes musicaux.
        </p>
        <p className="max-w-3xl text-sm text-neutral-300 sm:text-base">
          Le projet combine WebAudio, Next.js, ReactFlow, Supabase et une
          architecture pensée pour évoluer vers des versions mobiles et
          desktop. C’est à la fois un outil pour les musiciens et un terrain
          d’expérimentation pour repenser la manière de collaborer en musique.
        </p>
      </section>

      <section className="mt-8 space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-400">
        <h2 className="text-sm font-semibold text-neutral-100">
          Vision du projet
        </h2>
        <p>
          ForkJam vise à créer un espace où les idées musicales ne sont plus
          figées dans un fichier, mais reliées entre elles comme un organisme
          vivant. Une matière sonore qui se ramifie, se contredit, se
          transforme.
        </p>
        <p>
          Le projet est en développement actif. Si vous souhaitez suivre son
          évolution ou contribuer, vous pouvez{" "}
          {/* TODO: remplace par ton GitHub ou autre */}
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-neutral-200"
          >
            suivre le développement sur GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}