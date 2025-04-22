"use client";

import { create } from 'zustand';
import { RecordingData } from '@/lib/audioRecorder';
import { Node } from '@/lib/supabase';

interface AudioState {
  isRecording: boolean;
  isPlaying: boolean;
  currentNodeId: string | null;
  recordingData: RecordingData | null;
  playingNodes: Map<string, HTMLAudioElement>;
  setIsRecording: (isRecording: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentNodeId: (nodeId: string | null) => void;
  setRecordingData: (data: RecordingData | null) => void;
  playNode: (node: Node) => void;
  stopNode: (nodeId: string) => void;
  stopAllNodes: () => void;
  playBranch: (branch: Node[]) => void;
  setGain: (nodeId: string, gain: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isRecording: false,
  isPlaying: false,
  currentNodeId: null,
  recordingData: null,
  playingNodes: new Map(),
  
  setIsRecording: (isRecording) => set({ isRecording }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setCurrentNodeId: (nodeId) => set({ currentNodeId: nodeId }),
  
  setRecordingData: (data) => set({ recordingData: data }),
  
  playNode: (node) => {
    console.log("Trying to play:", node.audio_url);
  
    const { playingNodes } = get();
  
    if (playingNodes.has(node.id)) {
      get().stopNode(node.id);
    }
  
    const audio = new Audio(node.audio_url);
    audio.addEventListener('ended', () => {
      playingNodes.delete(node.id);
      set({ playingNodes: new Map(playingNodes) });
    });
  
    audio.play().catch(err => console.error('Error playing audio:', err));
  
    playingNodes.set(node.id, audio);
    set({ playingNodes: new Map(playingNodes) });
  },  
  
  stopNode: (nodeId) => {
    const { playingNodes } = get();
    const audio = playingNodes.get(nodeId);
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      playingNodes.delete(nodeId);
      set({ playingNodes: new Map(playingNodes) });
    }
  },
  
  stopAllNodes: () => {
    const { playingNodes } = get();
    
    playingNodes.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    set({ playingNodes: new Map() });
  },

  playBranch: (branch: Node[]) => {
    const newMap = new Map(get().playingNodes);
  
    branch.forEach(node => {
      const audio = new Audio(node.audio_url);
      audio.loop = true;
      audio.volume = 1;
      audio.play().catch(err => console.error('Error playing audio:', err));
      newMap.set(node.id, audio);
    });
  
    set({ playingNodes: newMap });
  },
  
  setGain: (nodeId: string, gain: number) => {
    const { playingNodes } = get();
    const audio = playingNodes.get(nodeId);
    if (audio) {
      audio.volume = gain;
    }
  }  
}));