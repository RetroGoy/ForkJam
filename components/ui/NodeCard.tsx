"use client";

import React from 'react';
import { Play, Pause, PlusCircle } from 'lucide-react';
import { Node } from '@/lib/supabase';
import { useAudioStore } from '@/store/useAudioStore';
import { Waveform } from './Waveform';
import { cn } from '@/lib/utils';

interface NodeCardProps {
  node: Node;
  isSelected?: boolean;
  onAddChild?: () => void;
}

export function NodeCard({ node, isSelected = false, onAddChild }: NodeCardProps) {
  const { playNode, stopNode, playingNodes } = useAudioStore();
  
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
  const waveformColor = node.instrument.toLowerCase().includes('piano') || 
                        node.instrument.toLowerCase().includes('synth') 
                          ? '#10b981' // green
                          : node.instrument.toLowerCase().includes('guitar') || 
                            node.instrument.toLowerCase().includes('bass')
                              ? '#ef4444' // red
                              : '#3b82f6'; // blue
  
  const handlePlayPause = () => {
    if (isPlaying) {
      stopNode(node.id);
    } else {
      playNode(node);
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
          <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs">
            {node.bpm} BPM
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePlayPause}
            className="rounded-full w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="rounded-full w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            >
              <PlusCircle size={16} />
            </button>
          )}
        </div>
      </div>
      
      <Waveform 
        audioUrl={node.audio_url} 
        color={waveformColor} 
        playing={isPlaying}
      />
      
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className="uppercase tracking-wide font-medium">
          {node.instrument}
        </span>
        <span className="opacity-70">
          User ID: {node.user_id.substring(0, 8)}
        </span>
      </div>
    </div>
  );
}