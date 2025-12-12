"use client";

import React from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Play, Pause } from "lucide-react";
import { InstrumentBackground } from "@/components/nodes/InstrumentBackground";
import { cn } from "@/lib/utils/utils";
import type { Node } from "@/lib/supabase/supabase";

interface BaseNodeCardProps {
  node: Node;
  colorClass: string;
  score: number;

  href?: string;

  isPlaying?: boolean;
  onPlayPause?: () => void;

  onUpvote?: (e: React.MouseEvent) => void;
  onDownvote?: (e: React.MouseEvent) => void;

  children?: React.ReactNode; // contenu custom (root / child / list)
}

export function BaseNodeCard({
  node,
  score,
  isPlaying,
  onPlayPause,
  onUpvote,
  onDownvote,
  colorClass,
  href,
  children,
}: BaseNodeCardProps) {
  const Wrapper = href ? (props: any) => <Link href={href} {...props} /> : "div";

  return (
    <Wrapper
      className={cn(
        "relative block rounded-[7px] overflow-hidden border border-border shadow-sm transition-all hover:shadow-lg",
        colorClass, // <-- la vraie couleur visible
        href && "hover:scale-[1.01] hover:border-primary/40"
      )}
    >
      {/* BACKGROUND INSTRUMENT */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <InstrumentBackground instrument={node.instrument} />
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/20 to-black/40" />
      </div>

      {/* CONTENT */}
      <div className="relative flex gap-3 p-3 z-10">
        {/* VOTES */}
        {onUpvote && onDownvote && (
          <div className="flex flex-col items-center w-10 shrink-0 mt-1">
            <button
              onClick={onUpvote}
              className="w-7 h-7 flex items-center justify-center rounded-[7px] bg-muted/50 hover:bg-muted/70"
            >
              <ChevronUp size={14} />
            </button>

            <span className="text-sm font-bold py-1">{score}</span>

            <button
              onClick={onDownvote}
              className="w-7 h-7 flex items-center justify-center rounded-[7px] bg-muted/50 hover:bg-muted/70"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {onPlayPause && (
            <button
              onClick={onPlayPause}
              className="absolute top-2 right-2 w-10 h-10 bg-black/30 hover:bg-black/40 rounded-lg flex items-center justify-center"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          )}

          {children}
        </div>
      </div>
    </Wrapper>
  );
}