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
  pause: () => void;
  stop: () => void;
  seek: (ratio: number) => void;
  setGain: (id: string, v: number) => void;
}

export const useAudioEngine = create<AudioState>((set, get) => ({
  engine: null,

  branch: [],
  currentTime: 0,
  duration: 0,
  isPlaying: false,

  init: () => {
    if (get().engine) return; // déjà initialisé

    // Sécurité : browser only
    if (typeof window === "undefined") return;

    const engine = new AudioEngine();

    engine.subscribe((t, d) => {
      set({ currentTime: t, duration: d });
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
  set({ currentTime: 0, isPlaying: false }); // ← AJOUT OBLIGATOIRE
},

  seek: (ratio) => {
    const engine = get().engine;
    if (!engine) return;

    engine.seek(ratio);
    set({ currentTime: engine.getCurrentTime() });
  },

  setGain: (id, v) => {
    const engine = get().engine;
    if (!engine) return;

    engine.setGain(id, v);
  },
}));