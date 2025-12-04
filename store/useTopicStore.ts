"use client";

import { create } from "zustand";
import type { Node } from "@/lib/supabase/supabase";
import { getRootNodes, getNode, getChildren } from "@/lib/supabase/supabase";

async function loadSubtree(rootId: string): Promise<Node[]> {
  // TEMP : fetch tous les descendants récursivement
  const root = await getNode(rootId);
  if (!root) return [];

  const result: Node[] = [root];

  async function walk(id: string) {
    const children = await getChildren(id);
    for (const c of children) {
      result.push(c);
      await walk(c.id);
    }
  }

  await walk(rootId);

  return result;
}

interface TopicState {
  topics: Node[];
  currentTopic: Node | null;
  nodes: Node[];
  isLoading: boolean;
  error: string | null;

  setTopics: (topics: Node[]) => void;
  setCurrentTopic: (topic: Node | null) => void;

  fetchTopics: () => Promise<void>;
  fetchNodesByTopic: (id: string) => Promise<void>;

  addNode: (node: Node) => void;
}

export const useTopicStore = create<TopicState>((set, get) => ({
  topics: [],
  currentTopic: null,
  nodes: [],
  isLoading: false,
  error: null,

  setTopics: (topics) => set({ topics }),

  setCurrentTopic: (topic) => set({ currentTopic: topic }),

  fetchTopics: async () => {
    set({ isLoading: true, error: null });
    try {
      const roots = await getRootNodes();
      set({ topics: roots, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchNodesByTopic: async (rootId) => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await loadSubtree(rootId);
      set({ nodes, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  addNode: (node) =>
    set((s) => ({
      nodes: [...s.nodes, node],
    })),
}));