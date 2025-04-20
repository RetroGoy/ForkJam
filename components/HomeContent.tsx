"use client";

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topic } from '@/lib/supabase';
import { useTopicStore } from '@/store/useTopicStore';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface HomeContentProps {
  initialTopics: Topic[];
}

export function HomeContent({ initialTopics }: HomeContentProps) {
  const { topics, setTopics, fetchTopics } = useTopicStore(state => ({
    topics: state.topics,
    setTopics: (topics: Topic[]) => state.topics = topics,
    fetchTopics: state.fetchTopics,
  }));
  
  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);
  
  return (
    <div className="flex h-full">
      <div className="w-64 h-full">
        <Sidebar topics={topics} />
      </div>
      
      <div className="flex-1 overflow-hidden bg-gray-900 relative">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern" />
        
        <div className="relative p-8 flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-4xl font-bold mb-6 text-yellow-400 tracking-widest">
            DRUIDE 500
          </h1>
          
          <p className="text-xl mb-8 max-w-lg text-gray-300">
            A retro-futuristic music collaboration platform where you can create and build
            upon musical ideas in a tree-like structure.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-800/70 border border-yellow-900/30 rounded-lg p-6 backdrop-blur-sm text-left">
              <h2 className="text-lg font-bold mb-3 text-yellow-500">CREATE A TOPIC</h2>
              <p className="text-gray-300 mb-4">
                Start a new musical idea by creating a topic. 
                This will be the root of your musical tree.
              </p>
              <Link href="/topic/new">
                <button className="flex items-center gap-2 bg-yellow-800 hover:bg-yellow-700 text-yellow-100 py-2 px-4 rounded-md transition-colors">
                  <Plus size={16} />
                  <span>New Topic</span>
                </button>
              </Link>
            </div>
            
            <div className="bg-gray-800/70 border border-yellow-900/30 rounded-lg p-6 backdrop-blur-sm text-left">
              <h2 className="text-lg font-bold mb-3 text-yellow-500">EXPLORE TOPICS</h2>
              <p className="text-gray-300 mb-4">
                Browse existing topics and contribute to the musical conversation.
              </p>
              <div className="flex justify-between">
                <div className="text-sm text-gray-400">Recent topics: {topics.length}</div>
                <button 
                  onClick={() => fetchTopics()}
                  className="text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-gray-500 text-sm">
            No account required. Just start creating.
          </div>
        </div>
      </div>
    </div>
  );
}