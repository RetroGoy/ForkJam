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
        <p className="text-sm text-muted-foreground sm:text-base">
          Vous pouvez me contacter ici :
        </p>
        <p className="font-mono text-sm text-yellow-300 sm:text-base">
          n.naveau@icloud.com - 06.01.82.60.94
        </p>
      </section>
    </main>
  );
}