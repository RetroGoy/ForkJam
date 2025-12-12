"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Node } from "@/lib/supabase/supabase";
import { NodeCard } from "@/components/nodes/NodeCard";
import { PlusCircle } from "lucide-react";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

export function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [myNodes, setMyNodes] = useState<Node[]>([]);
  const [communityNodes, setCommunityNodes] = useState<Node[]>([]);
  const [topics, setTopics] = useState<Node[]>([]);

      const audio = useAudioEngine();
    function handleToggle(node: Node) {
      const branch = [{ id: node.id, audio_url: node.audio_url }];
      audio.loadBranch(branch).then(() => {
        audio.isPlaying ? audio.pause() : audio.play();
      });
    }

  // Fetch session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUser(session?.user ?? null)
    );
  }, []);

  // Fetch nodes (mine + community)
  useEffect(() => {
    if (!user) return;

    (async () => {

      // My nodes
      const { data: mine } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      setMyNodes(mine ?? []);

      // Community nodes = everything NOT created by user
      const { data: global } = await supabase
        .from("nodes")
        .select("*")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      setCommunityNodes(global ?? []);
    })();
  }, [user]);

  if (!user) return null;

  // Membership time
  const createdAt = new Date(user.created_at ?? user.created ?? "");
  const now = new Date();
  const diffMonths = (now.getFullYear() - createdAt.getFullYear()) * 12 +
                     (now.getMonth() - createdAt.getMonth());
  const memberLabel = diffMonths >= 12
    ? `${Math.floor(diffMonths / 12)} ans`
    : `${diffMonths} mois`;

  // Settings modal opener
  function openSettings() {
    window.dispatchEvent(new CustomEvent("forkjam:open-settings"));
  }

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto space-y-12">

      {/* ================= HEADER ================= */}
      <div className="p-6 rounded-xl border border-border bg-muted/10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-yellow-400">
              {user.username ?? "Jean Valjean"}
            </h1>

            <p className="text-muted-foreground text-sm">
              {user.email}
            </p>

            <p className="text-muted-foreground/60 text-sm mt-1">
              Membre depuis {memberLabel}
            </p>
          </div>

          <button
            onClick={openSettings}
            className="px-4 py-2 rounded-md bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
          >
            Modifier le profil
          </button>
        </div>
      </div>

      {/* ================= COMMUNITY NODES ================= */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Nœuds récents de la communauté</h2>

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

        <div className="text-center">
          <Link
            href="/explore"
            className="inline-block mt-4 px-6 py-3 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition"
          >
            Explorer
          </Link>
        </div>
      </section>

      {/* ================= MY NODES ================= */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Vos derniers nœuds</h2>
        </div>

        {myNodes.length === 0 ? (
          <p className="text-muted-foreground">Vous navez pas encore créé de nœuds.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {myNodes.map((n) => (
              <NodeCard key={n.id} node={n} variant="root" clickable />
            ))}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("forkjam:open-recorder", {
                  detail: { mode: "root" },
                })
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition"
          >
            <PlusCircle size={18} />
            Créer un topic
          </button>
        </div>
      </section>
    </div>
  );
}