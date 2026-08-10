"use client";

import React from "react";
import type { Node } from "@/lib/supabase/supabase";
import { NodeCard } from "@/components/nodes/NodeCard";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";
import { useRootSearch } from "@/components/search/RootSearchContext";

export function MasonryGallery({ topics }: { topics: Node[] }) {
  const audio = useAudioEngine();
  const { topicScores } = useRootSearch();

  function handleToggle(node: Node) {
    const branch = [{ id: node.id, audio_url: node.audio_url }];
    audio.loadBranch(branch).then(() => {
      audio.isPlaying ? audio.pause() : audio.play();
    });
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {topics.map((node) => {
        const playingThis =
          audio.isPlaying && audio.branch.some((b) => b.id === node.id);

        return (
          <div key={node.id} className="break-inside-avoid">
            <NodeCard
              node={node}
              variant="root"
              score={topicScores[node.id] ?? 0}
              isPlaying={playingThis}
              onPlayPause={() => handleToggle(node)}
            />
          </div>
        );
      })}
    </div>
  );
}