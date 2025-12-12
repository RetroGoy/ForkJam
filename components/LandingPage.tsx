"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle, Users, Trees, AudioWaveform } from "lucide-react";
import { getRootNodes, type Node, supabase } from "@/lib/supabase/supabase";
import { NodeCard } from "@/components/nodes/NodeCard";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

export function LandingPage() {
  const [topics, setTopics] = useState<Node[]>([]);
  const [user, setUser] = useState<any>(null);

    const audio = useAudioEngine();
  function handleToggle(node: Node) {
    const branch = [{ id: node.id, audio_url: node.audio_url }];
    audio.loadBranch(branch).then(() => {
      audio.isPlaying ? audio.pause() : audio.play();
    });
  }

  // Vérifier si user connecté → rediriger vers /feed
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (user && typeof window !== "undefined") {
      window.location.href = "/feed";
    }
  }, [user]);

  // Charger quelques topics pour la preview
  useEffect(() => {
    (async () => {
      const data = await getRootNodes();
      if (data) setTopics(data.slice(0, 6));
    })();
  }, []);

  // Si user connecté, on ne rend rien (redirection gérée plus haut)
  if (user) return null;

  return (
      <>
      <section className="relative flex flex-col items-center px-6 py-24 sm:py-32 text-center overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,229,80,0.08),transparent_70%)] pointer-events-none" />

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-yellow-400 drop-shadow-lg">
          La musique pousse.
        </h1>
        <p className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          ForkJam est un espace collaboratif où les idées musicales deviennent 
          des branches vivantes. Explorez, enregistrez, étendez. Ensemble.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-md bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 transition"
          >
            Commencer maintenant
          </Link>

          <a
            href="#landing-gallery"
            className="px-6 py-3 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition text-lg"
          >
            Explorer
          </a>
        </div>

        {/* MINI GRAPH (remplace ou garde ton SVG/visuel) */}
        <div className="mt-20 relative">
          <Image
            src="/hero-mini-graph.png"
            alt="Mini graphe musical"
            width={700}
            height={400}
            className="opacity-90 mx-auto drop-shadow-xl"
          />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 px-6 bg-background/50 backdrop-blur text-center border-t border-border">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Pensé pour les créateurs
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-4 opacity-80 text-xs text-muted-foreground">
          <span className="px-3 py-1 rounded-full border border-border bg-muted/10">
            Beatmakers indépendants
          </span>
          <span className="px-3 py-1 rounded-full border border-border bg-muted/10">
            Guitaristes & chanteurs
          </span>
          <span className="px-3 py-1 rounded-full border border-border bg-muted/10">
            Producteurs en ligne
          </span>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
          Un instrument social.
        </h2>

        <p className="text-lg sm:text-xl max-w-2xl mx-auto text-muted-foreground mb-12">
          Enregistrez un riff, écoutez vos branches parentes, 
          faites pousser un arbre musical à plusieurs mains.
        </p>

        <div className="relative rounded-xl border border-border bg-black/40 shadow-xl overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-h-[420px] object-cover"
            src="/demo/forkjam-demo.mp4"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-background/60 backdrop-blur border-t border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">

          <div className="p-6 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition">
            <AudioWaveform size={42} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Créer instantanément</h3>
            <p className="text-muted-foreground">
              Enregistrez vos idées directement dans le graphe, sans ouvrir un DAW.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition">
            <Trees size={42} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Faire pousser des branches</h3>
            <p className="text-muted-foreground">
              Chaque noeud est une piste. 
              La musique devient organique et visuelle.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition">
            <Users size={42} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Collaborer facilement</h3>
            <p className="text-muted-foreground">
              Rejoignez des topics et étendez les idées d’autres musiciens.
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section id="landing-gallery" className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-8 text-center">
          Explorez des arbres musicaux
        </h2>

        {topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {topics.map((t) => {
              const playingThis =
                audio.isPlaying && audio.branch.some((b) => b.id === t.id);

              return (
                <NodeCard
                  key={t.id}
                  node={t}
                  variant="root"
                  isPlaying={playingThis}
                  onPlayPause={() => handleToggle(t)}
                />
              );
            })}
          </div>
        ) : (
          <p>Aucun topic pour le moment.</p>
        )}
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 text-center bg-background/50 border-t border-border">
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
          Rejoignez la forêt.
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          ForkJam pousse grâce à vous. Lancez votre premier riff, 
          partagez une idée, ou étendez une branche existante.
        </p>

        <Link
          href="/auth/signup"
          className="px-8 py-4 rounded-md bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 transition"
        >
          S inscrire
        </Link>
      </section>
      </>
  );
}