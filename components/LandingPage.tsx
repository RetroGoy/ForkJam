"use client";
/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Users, Trees, AudioWaveform } from "lucide-react";
import {
  getRootNodes,
  getTopicScores,
  type Node,
  supabase,
} from "@/lib/supabase/supabase";
import { NodeCard } from "@/components/nodes/NodeCard";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

function ParallaxImage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      const img = imgRef.current;
      if (!wrap || !img) return;

      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.min(Math.max(progress, 0), 1);

      const extra = Math.max(0, img.clientWidth - wrap.clientWidth);
      const x = -clamped * extra;
      img.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    // capture = true pour capter le scroll du conteneur (html/body en overflow:hidden)
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative -mt-4 mb-6 w-full overflow-hidden"
    >
      <img
        ref={imgRef}
        src="/images/parallaxe.png"
        alt="ForkJam — graphe musical"
        className="block w-[110%] max-w-none will-change-transform"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
    </div>
  );
}

export function LandingPage() {
  const [topics, setTopics] = useState<Node[]>([]);
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});
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
      setTopicScores(await getTopicScores());
    })();
  }, []);

  // Si user connecté, on ne rend rien (redirection gérée plus haut)
  if (user) return null;

  return (
      <>
      <section className="relative flex flex-col items-center pt-24 sm:pt-32 text-center overflow-y-auto overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,229,80,0.08),transparent_70%)] pointer-events-none" />

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-yellow-400 drop-shadow-lg">
          La musique pousse.
        </h1>
        <p className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Vos idées musicales deviennent des branches vivantes. 
          Explorez, enregistrez, étendez. Ensemble.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/auth/signup"
            className="rounded-full bg-yellow-400 px-7 py-3 text-lg z-5 font-bold text-black shadow-lg shadow-yellow-900/20 transition hover:bg-yellow-300"
          >
            Commencer maintenant
          </Link>

          <a
            href="#landing-gallery"
            className="rounded-full border border-white/10 bg-white/5 px-7 py-3 text-lg text-foreground/80 transition hover:bg-white/10 hover:text-foreground"
          >
            Explorer
          </a>
        </div>
    
        <ParallaxImage />
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 px-6 bg-background/50 backdrop-blur text-center border-t border-border">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Pensé pour les créateurs
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-4 opacity-80 text-xs text-muted-foreground">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Beatmakers indépendants
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Guitaristes & chanteurs
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
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

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-h-[420px] object-cover"
            src="/demo/DemoForkJam.mov"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-10 sm:py-20 px-6 bg-background/60 backdrop-blur border-t border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]">
            <AudioWaveform size={42} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-md sm:text-xl font-bold mb-2">Créer instantanément</h3>
            <p className="text-muted-foreground text-sm sm:text-md">
              Enregistrez vos idées directement dans le graphe, sans ouvrir un DAW.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]">
            <Trees size={42} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-md sm:text-xl font-bold mb-2">Faire pousser des branches</h3>
            <p className="text-muted-foreground text-sm sm:text-md">
              Chaque noeud est une piste. 
              La musique devient organique et visuelle.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:bg-white/[0.06]">
            <Users size={42} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-md sm:text-xl font-bold mb-2">Collaborer facilement</h3>
            <p className="text-muted-foreground text-sm sm:text-md">
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
                  score={topicScores[t.id] ?? 0}
                  isPlaying={playingThis}
                  onPlayPause={() => handleToggle(t)}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center text-sm text-muted-foreground">
            Aucun topic pour le moment.
          </div>
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
          className="inline-block rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-900/20 transition hover:bg-yellow-300"
        >
          S'inscrire
        </Link>
      </section>
      </>
  );
}