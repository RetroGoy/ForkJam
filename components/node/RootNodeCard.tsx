"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Music2,
  User,
  MapPin,
} from "lucide-react";
import type { Node } from "@/lib/supabase/supabase";
import { useRootSearch } from "@/components/search/RootSearchContext";
import { getColorClass } from "@/lib/utils/getColorClass";
import { InstrumentBackground } from "@/components/nodes/InstrumentBackground";

function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  const created = new Date(dateString).getTime();
  const diffMs = Date.now() - created;

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  const m = Math.floor(d / 30);
  const y = Math.floor(d / 365);

  if (y > 0) return y === 1 ? "1 year ago" : `${y} years ago`;
  if (m > 0) return m === 1 ? "1 month ago" : `${m} months ago`;
  if (d > 0) return d === 1 ? "1 day ago" : `${d} days ago`;
  if (h > 0) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  if (min > 0) return min === 1 ? "1 minute ago" : `${min} minutes ago`;
  return "Just now";
}

export function RootNodeCard({ node }: { node: Node }) {
  const { votes, handleVoteClick } = useRootSearch();
  const score = (node.note ?? 0) + (votes[node.id] ?? 0);
  const timeAgo = formatTimeAgo(node.created_at);

  return (
<Link
  href={`/${node.id}`}
  className={`
    relative block rounded-[7px] overflow-hidden
    ${getColorClass(node.tag ?? "")}
    border border-border shadow-sm
    hover:shadow-lg hover:border-primary/40 hover:scale-[1.01]
    transition-all
  `}
>
        
    <div className="absolute inset-0 z-0 pointer-events-none">
    <InstrumentBackground instrument={node.instrument} />
    {/* Gradient */}  
    <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/20 to-black/40" />
    </div>
      <div className="relative flex gap-3 p-3 z-10">
        {/* VOTES */}
        <div className="flex flex-col items-center w-10 shrink-0 mt-1">
          <button
            onClick={(e) => handleVoteClick(e, node, 1)}
            className={`
              w-7 h-7 flex items-center justify-center rounded-sm transition
              ${
                votes[node.id] === 1
                  ? "bg-primary text-black"
                  : "bg-muted hover:bg-muted/70"
              }
            `}
          >
            <ChevronUp size={14} />
          </button>

          <span className="text-sm font-bold py-1">{score}</span>

          <button
            onClick={(e) => handleVoteClick(e, node, -1)}
            className={`
              w-7 h-7 flex items-center justify-center rounded-sm transition
              ${
                votes[node.id] === -1
                  ? "bg-destructive text-white"
                  : "bg-muted hover:bg-muted/70"
              }
            `}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase line-clamp-2">
              {node.title}
            </h3>

            {timeAgo && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                <Clock size={11} />
                {timeAgo}
              </span>
            )}
          </div>

          {node.description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground/80 font-medium mt-1">
              {node.description.length > 80
                ? node.description.slice(0, 80) + "…"
                : node.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border">
              <Music2 size={11} />
              {node.tag || "No tag"}
            </span>

            {typeof node.bpm === "number" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border">
                {node.bpm} BPM
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <User size={12} />
            </div>

            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>
                {node.location != null ? `Dept. ${node.location}` : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}