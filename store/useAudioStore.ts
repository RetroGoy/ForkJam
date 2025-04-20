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
    const { playingNodes } = get();
    
    // Stop this node if it's already playing
    if (playingNodes.has(node.id)) {
      get().stopNode(node.id);
    }
    
    // Create and play the audio
    const audio = new Audio(node.audio_url);
    audio.addEventListener('ended', () => {
      playingNodes.delete(node.id);
      set({ playingNodes: new Map(playingNodes) });
    });
    
    audio.play().catch(err => console.error('Error playing audio:', err));
    
    // Add to playing nodes
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
  }
}));