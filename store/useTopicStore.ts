"use client";

import { create } from 'zustand';
import { Topic, Node, getTopics, getNodesByTopic } from '@/lib/supabase';

interface TopicState {
  topics: Topic[];
  currentTopic: Topic | null;
  nodes: Node[];
  isLoading: boolean;
  error: string | null;
  setTopics: (topics: Topic[]) => void;
  fetchTopics: () => Promise<void>;
  fetchNodesByTopic: (topicId: string) => Promise<void>;
  setCurrentTopic: (topic: Topic | null) => void;
  addNode: (node: Node) => void;
}

export const useTopicStore = create<TopicState>((set, get) => ({
  topics: [],
  currentTopic: null,
  nodes: [],
  isLoading: false,
  error: null,

  setTopics: (topics) => set({ topics }),

  fetchTopics: async () => {
    set({ isLoading: true, error: null });
    try {
      const topics = await getTopics();
      set({ topics, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error fetching topics',
        isLoading: false,
      });
    }
  },

  fetchNodesByTopic: async (topicId) => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await getNodesByTopic(topicId);
      set({ nodes, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error fetching nodes',
        isLoading: false,
      });
    }
  },

  setCurrentTopic: (topic) => {
    set({ currentTopic: topic });
    if (topic) {
      get().fetchNodesByTopic(topic.id);
    }
  },

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node]
    }));
  }
}));
