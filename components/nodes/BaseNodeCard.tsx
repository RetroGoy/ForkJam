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
  userVote?: 1 | -1 | 0;
  href?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onUpvote?: (e: React.MouseEvent) => void;
  onDownvote?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export function BaseNodeCard({
  node,
  score,
  userVote = 0,
  isPlaying,
  onPlayPause,
  onUpvote,
  onDownvote,
  colorClass,
  href,
  children,
}: BaseNodeCardProps) {
  const Wrapper = href ? (props: any) => <Link href={href} {...props} /> : "div";

  const stop = (e: React.MouseEvent, fn?: (e: React.MouseEvent) => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.(e);
  };

  const voteBtn = (active: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-full transition ${
      active
        ? "bg-yellow-400 text-black"
        : "bg-black/30 text-white/80 hover:bg-black/50 hover:text-white"
    }`;

  return (
    <Wrapper
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/10 shadow-lg transition-all",
        colorClass,
        href &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:ring-1 hover:ring-white/20",
        isPlaying &&
          "ring-2 ring-yellow-400 shadow-[0_0_22px_rgba(250,204,21,0.55)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <InstrumentBackground instrument={node.instrument} />
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/35 to-black/70" />
      </div>

      <div className="relative z-10 flex gap-3 p-3.5">
        {onUpvote && onDownvote && (
          <div className="flex w-9 shrink-0 flex-col items-center gap-1">
            <button onClick={(e) => stop(e, onUpvote)} className={voteBtn(userVote === 1)}>
              <ChevronUp size={15} />
            </button>
            <span
              className={`text-sm font-bold ${
                node.is_root ? "text-yellow-400" : "text-white"
              }`}
            >
              {score}
            </span>
            <button onClick={(e) => stop(e, onDownvote)} className={voteBtn(userVote === -1)}>
              <ChevronDown size={15} />
            </button>
          </div>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
          {onPlayPause && (
            <button
              onClick={(e) => stop(e, () => onPlayPause())}
              className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              {isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="translate-x-[1px]" />
              )}
            </button>
          )}

          {children}
        </div>
      </div>
    </Wrapper>
  );
}
