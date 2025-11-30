"use client";

import React from 'react';
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { getUserVoteForNode, toggleNodeVote } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Play, Pause, Plus } from 'lucide-react';
import { NodeWithUser } from '@/lib/supabase';
import { useAudioStore } from '@/store/useAudioStore';
import { cn } from '@/lib/utils';
import { getBranchFrom } from '@/lib/audioUtils';

interface NodeCardProps {
  node: NodeWithUser;
  isSelected?: boolean;
  onAddChild?: () => void;
    onSelect?: (node: NodeWithUser) => void;
  allNodes: NodeWithUser[];
}

export function NodeCard({ node, isSelected = false, onAddChild, onSelect, allNodes }: NodeCardProps) {
  const { playBranch, stopAllNodes, playingNodes } = useAudioStore();
  const isPlaying = playingNodes.has(node.id);
  
  const getInstrumentColor = (instrument: string) => {
    const lowerInstrument = instrument.toLowerCase();
    if (lowerInstrument.includes('piano') || lowerInstrument.includes('synth')) {
      return 'bg-green-600 border-green-500 text-green-100';
    }
    if (lowerInstrument.includes('guitar') || lowerInstrument.includes('bass')) {
      return 'bg-red-600 border-red-500 text-red-100';
    }
    if (lowerInstrument.includes('drum') || lowerInstrument.includes('percussion')) {
      return 'bg-blue-600 border-blue-500 text-blue-100';
    }
    return 'bg-purple-600 border-purple-500 text-purple-100';
  };
  
  const instrumentColor = getInstrumentColor(node.instrument);
  
  const handlePlayPause = () => {
    onSelect?.(node);

    if (isPlaying) {
      stopAllNodes();
    } else {
      const branch = getBranchFrom(allNodes, node.id);
      playBranch(branch);
    }
  };

  const handleUpvote = async () => {
    const next = userVote === 1 ? 0 : 1;
    setUserVote(next); // optimistic UI
    await toggleNodeVote(node.id, 1);
  };

  const handleDownvote = async () => {
    const next = userVote === -1 ? 0 : -1;
    setUserVote(next);
    await toggleNodeVote(node.id, -1);
  };

  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);

    useEffect(() => {
      getUserVoteForNode(node.id).then(setUserVote);
    }, [node.id]);

    const score = (node.note ?? 0) + userVote;

 return (
  <div
    className={cn(
      "relative rounded-lg p-4 transition-all duration-200 shadow-md overflow-hidden",
      instrumentColor,
      score > 2 && "brightness-[1.15]",
      score < -2 && "brightness-[0.75]",
      "bg-gradient-to-br from-white/10 via-transparent to-black/40",
      "before:absolute before:inset-0 before:bg-[url('https://grainy-gradients.vercel.app/noise.svg')] before:opacity-[0.08]",
      isSelected && "ring-2 ring-yellow-400 shadow-yellow-400/20",
      
    )}
  >
    {/* PLAY BUTTON TOP RIGHT — bigger */}
    <button
      onClick={handlePlayPause}
      className="absolute top-2 right-2 w-11 h-11 rounded-lg bg-black/30 hover:bg-black/40 flex items-center justify-center transition"
    >
      {isPlaying ? <Pause size={22} /> : <Play size={22} />}
    </button>

    {/* TITLE */}
    <h3 className="text-lg font-extrabold tracking-wide uppercase mb-3 pr-14">
      {node.title}
    </h3>

    <div className="flex gap-3">

      {/* LEFT VOTES */}
      <div className="flex flex-col items-center w-8 mt-1">
        <button
          onClick={handleUpvote}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-sm transition",
            userVote === 1 ? "bg-yellow-500 text-black" : "bg-black/30 hover:bg-black/40"
          )}
        >
          <ThumbsUp size={14} />
        </button>

        <span className="text-sm font-bold py-1">{score}</span>

        <button
          onClick={handleDownvote}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-sm transition",
            userVote === -1 ? "bg-red-500 text-black" : "bg-black/30 hover:bg-black/40"
          )}
        >
          <ThumbsDown size={14} />
        </button>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex flex-col flex-1 justify-end">

        {/* INSTRUMENT + USER AT BOTTOM */}
        <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/10">

          <span className="px-2 py-1 text-xs rounded-md bg-black/30 border border-white/10 uppercase tracking-wider whitespace-nowrap">
            {node.instrument}
          </span>

          <span className="text-xs opacity-80 whitespace-nowrap">
            {node.users?.username ?? "Unknown"}
          </span>

        </div>

      </div>
    </div>
  </div>
);
}