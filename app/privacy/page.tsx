// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — ForkJam",
  description:
    "Informations sur la collecte et l’utilisation des données personnelles dans ForkJam.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          ForkJam collecte uniquement les informations nécessaires au bon
          fonctionnement de la plateforme :
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground sm:text-sm">
          <li>adresse e-mail et identifiant utilisateur ;</li>
          <li>fichiers audio téléchargés ou enregistrés ;</li>
          <li>métadonnées liées aux nœuds et aux topics créés.</li>
        </ul>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Aucune donnée n’est vendue ou transférée à des tiers. Les fichiers
          audio sont stockés sur l’infrastructure de Supabase.
        </p>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Les utilisateurs peuvent demander la suppression de leurs données en
          écrivant à :
        </p>
        <p className="font-mono text-sm text-yellow-300 sm:text-base">
          n.naveau@icloud.com
        </p>
      </section>
    </main>
  );
}