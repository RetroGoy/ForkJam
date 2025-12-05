"use client";

import { ThumbsUp, ThumbsDown, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { getNodeColor } from "@/lib/utils/getNodeColor";
import type { Node } from "@/lib/supabase/supabase";

interface NodeCardProps {
  node: Node;
  isSelected?: boolean;
  isPlaying: boolean;
  score: number;

  // callbacks délégués au parent
  onPlayPause: () => void;
  onUpvote: () => void;
  onDownvote: () => void;
  onAddChild?: () => void;

  // pour l’héritage audio etc.
  isRoot: boolean;
}

export function NodeCard({
  node,
  isSelected = false,
  isPlaying,
  score,
  onPlayPause,
  onUpvote,
  onDownvote,
  onAddChild,
  isRoot,
}: NodeCardProps) {
  const instrumentColor = getNodeColor(node.instrument);

  return (
    <div
className={cn(
  "relative rounded-lg p-4 transition-all duration-200 shadow-md overflow-hidden",
  instrumentColor,
  score > 2 && "brightness-[1.15]",
  score < -2 && "brightness-[0.75]",
  "bg-gradient-to-br from-white/10 via-transparent to-black/40",
  "before:absolute before:inset-0 before:bg-[url('https://grainy-gradients.vercel.app/noise.svg')] before:opacity-[0.08]",
  (isSelected || isPlaying) && "ring-2 ring-yellow-300 brightness-110 shadow-yellow-400/20",
)}
    >
      {/* PLAY BUTTON */}
      <button
        onClick={onPlayPause}
        className="absolute top-2 right-2 w-11 h-11 bg-black/30 hover:bg-black/40 flex items-center justify-center transition"
      >
        {isPlaying ? <Pause size={22} /> : <Play size={22} />}
      </button>

      {/* TITLE */}
      <h3 className="text-lg font-extrabold tracking-wide uppercase mb-3 pr-14">
        {node.title}
      </h3>

      <div className="flex gap-3">
        {/* VOTES */}
        <div className="flex flex-col items-center w-8 mt-1">
          <button
            onClick={onUpvote}
            className={cn(
              "w-7 h-7 flex items-center justify-center transition",
              score - (node.note ?? 0) === 1
                ? "bg-yellow-500 text-black"
                : "bg-black/30 hover:bg-black/40"
            )}
          >
            <ThumbsUp size={14} />
          </button>

          <span className="text-sm font-bold py-1">{score}</span>

          <button
            onClick={onDownvote}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-sm transition",
              score - (node.note ?? 0) === -1
                ? "bg-red-500 text-black"
                : "bg-black/30 hover:bg-black/40"
            )}
          >
            <ThumbsDown size={14} />
          </button>
        </div>

        <div className="flex flex-col flex-1 justify-end">
          {/* ROOT MODE */}
          {isRoot ? (
            <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/10">
              <span className="px-2 py-1 mr-2 text-xs rounded-md bg-black/30 border border-white/10 uppercase tracking-wider whitespace-nowrap">
                {node.bpm ?? "???"} BPM
              </span>
              <span className="text-xs opacity-80 whitespace-nowrap">
                {node.username}
              </span>
            </div>
          ) : (
            /* CHILD MODE */
            <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/10">
              <span className="px-2 py-1 mr-2 text-xs rounded-md bg-black/30 border border-white/10 uppercase tracking-wider whitespace-nowrap">
                {node.instrument}
              </span>

              <span className="text-xs opacity-80 whitespace-nowrap">
                {node.username}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}