"use client";

import type React from "react";
import { Clock, Music2, User, MapPin } from "lucide-react";
import type { Node } from "@/lib/supabase/supabase";
import { BaseNodeCard } from "./BaseNodeCard";
import { computeNodeBase } from "./NodeBase";

interface NodeCardProps {
  node: Node;
  variant?: "root" | "child";

  score?: number;
  userVote?: 1 | -1 | 0;

  isPlaying?: boolean;
  onPlayPause?: () => void;
  onUpvote?: (e: React.MouseEvent) => void;
  onDownvote?: (e: React.MouseEvent) => void;

  clickable?: boolean;
  showDescription?: boolean;
  showFooter?: boolean;
  showBpm?: boolean;
  showTag?: boolean;
}

export function NodeCard({
  node,
  variant = "root",
  score,
  userVote,
  isPlaying,
  onPlayPause,
  onUpvote,
  onDownvote,
  clickable = variant === "root",
  showDescription = variant === "root",
  showFooter = true,
  showBpm = variant === "root",
  showTag = true,
}: NodeCardProps) {
  const base = computeNodeBase(node);
  const { colorClass, timeAgo } = base;
  const displayScore = score ?? base.score;

  return (
    <BaseNodeCard
      node={node}
      score={displayScore}
      userVote={userVote}
      colorClass={colorClass}
      isPlaying={isPlaying}
      onPlayPause={onPlayPause}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      href={clickable ? `/${node.id}` : undefined}
    >
      <div className="flex items-start justify-between gap-2 pr-10">
        <h3 className="line-clamp-2 text-sm font-extrabold uppercase leading-tight text-white sm:text-base">
          {node.title}
        </h3>
        {timeAgo && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-white/60">
            <Clock size={10} />
            {timeAgo}
          </span>
        )}
      </div>

      {showDescription && node.description && (
        <p className="mt-1 line-clamp-2 text-[11px] text-white/70 sm:text-xs">
          {node.description}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide">
        {showTag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-white/85 ring-1 ring-white/10">
            <Music2 size={10} />
            {node.tag || "No tag"}
          </span>
        )}
        {showBpm && typeof node.bpm === "number" && (
          <span className="inline-flex items-center rounded-full bg-black/30 px-2 py-0.5 text-white/85 ring-1 ring-white/10">
            {node.bpm} BPM
          </span>
        )}
      </div>

      {showFooter && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
          <span className="inline-flex items-center gap-1">
            <User size={11} />
            {node.username ?? "Unknown"}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} />
            {node.location != null ? `Dept. ${node.location}` : "Unknown"}
          </span>
        </div>
      )}
    </BaseNodeCard>
  );
}
