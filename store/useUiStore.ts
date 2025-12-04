"use client";

import { create } from "zustand";
import type { Node } from "@/lib/supabase/supabase";

interface UIState {
  recorderOpen: boolean;
  recorderParent: Node | null; // null = root
  openRecorder: (parent: Node | null) => void;
  closeRecorder: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  recorderOpen: false,
  recorderParent: null,

  openRecorder: (parent) =>
    set({ recorderOpen: true, recorderParent: parent }),

  closeRecorder: () => set({ recorderOpen: false, recorderParent: null }),
}));