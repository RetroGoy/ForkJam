"use client";

import type React from "react";
import { NodeCard } from "@/components/nodes/NodeCard";
import type { Node } from "@/lib/supabase/supabase";

interface ChildNodeProps {
  node: Node;
  score: number;
  colorClass: string;
  isPlaying: boolean;
  userVote?: 1 | -1 | 0;
  onPlayPause: () => void;
  onUpvote: (e: React.MouseEvent) => void;
  onDownvote: (e: React.MouseEvent) => void;
}

export function ChildNodeCard({
  node,
  score,
  isPlaying,
  userVote,
  onPlayPause,
  onUpvote,
  onDownvote,
}: ChildNodeProps) {
  return (
    <NodeCard
      node={node}
      variant="child"
      score={score}
      userVote={userVote}
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
