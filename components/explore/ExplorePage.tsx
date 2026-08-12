"use client";

import { NodeCard } from "@/components/nodes/NodeCard";
import type { Node } from "@/lib/supabase/supabase";
import { useRootSearch } from "@/components/search/RootSearchContext";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

export function ExplorePage() {
  const { sorted } = useRootSearch();
  const audio = useAudioEngine();

  function handleToggle(node: Node) {
    const branch = [{ id: node.id, audio_url: node.audio_url }];

    audio.loadBranch(branch).then(() => {
      audio.isPlaying ? audio.pause() : audio.play();
    });
  }

  return (
    <div className="px-4 pt-4 pb-24 md:pb-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Explore</h1>

      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((node: Node) => {
            const playingThis =
              audio.isPlaying && audio.branch.some((b) => b.id === node.id);

            return (
              <NodeCard
                key={node.id}
                node={node}
                variant="root"
                isPlaying={playingThis}
                onPlayPause={() => handleToggle(node)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground mt-8">
          Aucun résultat.
        </div>
      )}
    </div>
  );
}