"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  supabase,
  getRootNodes,
  getTopicScores,
  getRootIdMap,
  type Node,
} from "@/lib/supabase/supabase";
import { NodeCard } from "@/components/nodes/NodeCard";
import { PlusCircle, Settings, MapPin } from "lucide-react";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

export function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [myNodes, setMyNodes] = useState<Node[]>([]);
  const [topics, setTopics] = useState<Node[]>([]);
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});
  const [rootMap, setRootMap] = useState<Record<string, string>>({});

  const audio = useAudioEngine();

  function handleToggle(node: Node) {
    const branch = [{ id: node.id, audio_url: node.audio_url }];
    audio.loadBranch(branch).then(() => {
      audio.isPlaying ? audio.pause() : audio.play();
    });
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  // Communauté = 6 derniers topics racines + notes + map node->root
  useEffect(() => {
    (async () => {
      const roots = await getRootNodes();
      setTopics(roots.slice(0, 6));
      setTopicScores(await getTopicScores());
      setRootMap(await getRootIdMap());
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: mine } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      setMyNodes(mine ?? []);
    })();
  }, [user]);

  if (!user) return null;

  const username =
    user.user_metadata?.username ?? user.email?.split("@")[0] ?? "Anonyme";
  const department = user.user_metadata?.department ?? null;

  const createdAt = new Date(user.created_at ?? "");
  const now = new Date();
  const diffMonths = Math.max(
    0,
    (now.getFullYear() - createdAt.getFullYear()) * 12 +
      (now.getMonth() - createdAt.getMonth())
  );
  const memberLabel =
    diffMonths >= 12
      ? `${Math.floor(diffMonths / 12)} an${diffMonths >= 24 ? "s" : ""}`
      : `${diffMonths} mois`;

  const openSettings = () =>
    window.dispatchEvent(new CustomEvent("forkjam:open-settings"));
  const openRecorder = () =>
    window.dispatchEvent(
      new CustomEvent("forkjam:open-recorder", { detail: { mode: "root" } })
    );

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-yellow-400">{username}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70">
              <span>Membre depuis {memberLabel}</span>
              {department && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} /> Dept. {department}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={openSettings}
          title="Paramètres"
          className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* COMMUNAUTÉ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Topics récents de la communauté</h2>

        {topics.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center text-sm text-muted-foreground">
            Aucun topic pour le moment.
          </div>
        )}

        <div className="pt-1 text-center">
          <Link
            href="/explore"
            className="inline-block rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-foreground/80 transition hover:bg-white/10 hover:text-foreground"
          >
            Explorer
          </Link>
        </div>
      </section>

      {/* MES NŒUDS */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Vos derniers nœuds</h2>

        {myNodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas encore créé de nœuds.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {myNodes.map((n) => {
              const rootId = rootMap[n.id] ?? n.id;
              return (
                <Link key={n.id} href={`/${rootId}`} className="block">
                  <NodeCard
                    node={n}
                    variant="root"
                    score={topicScores[rootId] ?? 0}
                    clickable={false}
                  />
                </Link>
              );
            })}
          </div>
        )}

        <div className="pt-1 text-center">
          <button
            onClick={openRecorder}
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300"
          >
            <PlusCircle size={18} />
            Créer un topic
          </button>
        </div>
      </section>
    </div>
  );
}
