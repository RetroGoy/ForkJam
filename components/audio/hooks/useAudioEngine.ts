"use client";

import { create } from "zustand";
import { AudioEngine } from "../engine/AudioEngine";

type BranchNode = {
  id: string;
  audio_url: string | null;
};

interface AudioState {
  engine: AudioEngine | null;

  branch: BranchNode[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;

  init: () => void;
  loadBranch: (branch: BranchNode[]) => Promise<void>;
  play: () => void;
  playAt: (ctxStartTime: number) => void;
  pause: () => void;
  stop: () => void;
  seek: (ratio: number) => void;
  setGain: (id: string, v: number) => void;

  // overdub local (prise en cours, non sauvegardée)
  setOverdub: (buffer: AudioBuffer | null, gain?: number) => void;
  setOverdubGain: (v: number) => void;
}

export const useAudioEngine = create<AudioState>((set, get) => ({
  engine: null,

  branch: [],
  currentTime: 0,
  duration: 0,
  isPlaying: false,

  init: () => {
    if (get().engine) return;
    if (typeof window === "undefined") return;

    const engine = new AudioEngine();

    engine.subscribe((t, d) => {
      // fin de lecture naturelle -> on repasse en pause
      const done = d > 0 && t >= d;
      set({ currentTime: t, duration: d, isPlaying: done ? false : get().isPlaying });
    });

    set({ engine });
  },

  loadBranch: async (branch) => {
    const engine = get().engine;
    if (!engine) return;

    set({ branch });
    await engine.loadBranch(branch);
    set({ currentTime: 0, duration: engine.getDuration() });
  },

  play: () => {
    const engine = get().engine;
    if (!engine) return;
    engine.play();
    set({ isPlaying: true });
  },

  playAt: (ctxStartTime) => {
    const engine = get().engine;
    if (!engine) return;
    engine.playAt(ctxStartTime);
    set({ isPlaying: true });
  },

  pause: () => {
    const engine = get().engine;
    if (!engine) return;
    engine.pause();
    set({ isPlaying: false });
  },

  stop: () => {
    const engine = get().engine;
    if (!engine) return;
    engine.stop();
    set({ currentTime: 0, isPlaying: false });
  },

  seek: (ratio) => {
    const engine = get().engine;
    if (!engine) return;
    engine.seek(ratio);
    set({ currentTime: engine.getCurrentTime() });
  },

  setGain: (id, v) => {
    get().engine?.setGain(id, v);
  },

  setOverdub: (buffer, gain = 1) => {
    const engine = get().engine;
    if (!engine) return;
    engine.setOverdub(buffer, gain);
    set({ duration: engine.getDuration() });
  },

  setOverdubGain: (v) => {
    get().engine?.setOverdubGain(v);
  },
}));
