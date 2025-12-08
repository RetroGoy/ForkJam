// app/legal/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — ForkJam",
  description:
    "Informations légales concernant l’éditeur et l’hébergement de ForkJam.",
};

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Mentions légales
        </h1>
        <div className="space-y-2 text-sm text-neutral-300 sm:text-base">
          <p>
            <span className="font-semibold">Éditeur :</span> ForkJam
            {/* TODO: si tu veux, tu peux ajouter ton nom ici ou laisser plus flou tant que tu n’as pas de structure */}
          </p>
          <p>
            <span className="font-semibold">Responsable de publication :</span>{" "}
            {/* TODO: ton nom complet ou pseudo */}
            Nathanaël Naveau
          </p>
          <p>
            <span className="font-semibold">Contact :</span>{" "}
            <span className="font-mono">contact@forkjam.app</span>
          </p>
          <p>
            <span className="font-semibold">Hébergement :</span> Vercel Inc., 340
            S Lemon Ave #4133, Walnut, CA 91789, USA.
          </p>
        </div>
      </section>
    </main>
  );
}