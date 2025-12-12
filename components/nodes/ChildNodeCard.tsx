"use client";

import { NodeCard } from "@/components/nodes/NodeCard";
import type { Node } from "@/lib/supabase/supabase";

interface ChildNodeProps {
  node: Node;
  score: number;
  colorClass: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onUpvote: (e: React.MouseEvent) => void;
  onDownvote: (e: React.MouseEvent) => void;
}

export function ChildNodeCard({
  node,
  score,
  colorClass,
  isPlaying,
  onPlayPause,
  onUpvote,
  onDownvote,
}: ChildNodeProps) {
  return (
    <NodeCard
      node={node}
      variant="child"
      isPlaying={isPlaying}
      onPlayPause={onPlayPause}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      clickable={false}
      showDescription={false}
      showBpm={false}
      showFooter={true}
    />
  );
}