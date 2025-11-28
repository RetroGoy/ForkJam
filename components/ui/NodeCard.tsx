"use client";

import React from 'react';
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

  return (
    <div 
      className={cn(
        instrumentColor,
        "relative rounded-md border-2 p-3 transition-all duration-300",
        isSelected && "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20",
        "hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="text-lg font-bold tracking-tight">{node.title}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className="uppercase tracking-wide font-medium">
          {node.instrument}
        </span>
        <span className="opacity-70">
          {node.users?.username}
        </span>
      </div>
    </div>
  );
}