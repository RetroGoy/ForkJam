"use client";

import { Clock, Music2, User, MapPin, Play, Pause } from "lucide-react";
import type { Node } from "@/lib/supabase/supabase";
import { BaseNodeCard } from "./BaseNodeCard";
import { computeNodeBase } from "./NodeBase";


interface NodeCardProps {
  node: Node;
  variant?: "root" | "child"; 

  // Options fines
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
  const { score, colorClass, timeAgo } = computeNodeBase(node);

  return (
    <BaseNodeCard
      node={node}
      score={score}
      colorClass={colorClass}
      isPlaying={isPlaying}
      onPlayPause={onPlayPause}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      href={clickable ? `/${node.id}` : undefined}
    >
     {/* TITLE + TIME + PLAY */}
<div className="flex justify-between items-start gap-2">
  <div className="flex-1">
    <h3 className="text-sm sm:text-base font-extrabold uppercase line-clamp-2">
      {node.title}
    </h3>
  </div>

  {/* Right side = time + play */}
  <div className="flex items-center gap-2 whitespace-nowrap">

    {timeAgo && (
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock size={11} />
        {timeAgo}
      </span>
    )}


</div>
</div>

      {/* DESCRIPTION */}
      {showDescription && node.description && (
        <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-1">
          {node.description.length > 80
            ? node.description.slice(0, 80) + "…"
            : node.description}
        </p>
      )}

      {/* TAG / BPM */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
        {showTag && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[7px] bg-muted/80 border border-border">
            <Music2 size={11} />
            {node.tag || "No tag"}
          </span>
        )}

        {showBpm && typeof node.bpm === "number" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[7px] bg-muted/80 border border-border">
            {node.bpm} BPM
          </span>
        )}
      </div>

      {/* FOOTER */}
      {showFooter && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <User size={12} />
            {node.username ?? "Unknown"}
          </div>

          <div className="flex items-center gap-1">
            <MapPin size={12} />
            {node.location != null ? `Dept. ${node.location}` : "Unknown"}
          </div>
        </div>
      )}
    </BaseNodeCard>
  );
}