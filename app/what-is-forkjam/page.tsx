// app/what-is-forkjam/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qu’est-ce que ForkJam ?",
  description:
    "ForkJam est une plateforme musicale collaborative basée sur des graphes de nœuds audio. Enregistrez, explorez et faites évoluer vos idées musicales ensemble.",
};

export default function WhatIsForkJamPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Qu’est-ce que ForkJam ?
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          ForkJam est une plateforme où chaque idée musicale devient un nœud
          dans un graphe. Contrairement aux DAW classiques ou aux simples
          partages de fichiers, ForkJam permet de documenter l’évolution d’un
          riff, d’un beat ou d’une ligne d’accords sous forme d&apos;arborescence.
        </p>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Chaque branche est une variation. Chaque nœud contient un enregistrement
          audio. Le tout reste synchronisé sur un BPM unique, défini par le
          créateur du topic.
        </p>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]">
          <h2 className="text-sm font-semibold text-foreground">
            Ce que vous pouvez faire avec ForkJam
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Enregistrer une idée directement dans le navigateur.</li>
            <li>
              Écouter la chaîne parent → enfant pour comprendre l’évolution
              d’un riff.
            </li>
            <li>Mixer les volumes entre nœuds d’un même graphe.</li>
            <li>Créer des remixes non destructifs, sans écraser l’original.</li>
            <li>Collaborer à distance avec d’autres musiciens.</li>
          </ul>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]">
          <h2 className="text-sm font-semibold text-foreground">
            Une archive musicale vivante
          </h2>
          <p className="text-xs text-muted-foreground">
            ForkJam devient une archive musicale vivante : les idées ne
            disparaissent plus dans des projets locaux ou des dossiers
            chaotiques. Elles se structurent en graphes explorables, où chacun
            peut voir comment une idée a émergé, évolué, muté.
          </p>
          <p className="text-xs text-muted-foreground">
            Le but n’est pas de remplacer votre DAW, mais de créer un espace
            dédié à l’exploration, au partage et à la dérive créative.
          </p>
        </div>
      </section>
    </main>
  );
}