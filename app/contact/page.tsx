// app/contact/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — ForkJam",
  description:
    "Contactez le créateur de ForkJam pour toute question, proposition ou collaboration.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact
        </h1>
        <p className="max-w-3xl text-sm text-neutral-300 sm:text-base">
          Une question, une idée de collaboration, un retour sur la plateforme
          ou envie de tester ForkJam avec votre groupe ?
        </p>
        <p className="text-sm text-neutral-300 sm:text-base">
          Vous pouvez me contacter directement à l’adresse suivante :
        </p>
        <p className="text-sm font-mono text-yellow-300 sm:text-base">
          n.naveau@icloud.com
        </p>
      </section>
    </main>
  );
}