"use client";

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topic } from '@/lib/supabase';
import { useTopicStore } from '@/store/useTopicStore';
import { Header } from '@/components/layout/Header';
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
  }, [initialTopics, setTopics]);
  
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden bg-gray-800 relative">

        <Header />
        <div className="flex">
          <Sidebar topics={topics} />
          
          <div className="flex flex-col m-8 mx-12">
            
            <h1 className="text-5xl font-extrabold mb-6 text-yellow-500 tracking-wider">
              Welcome to DRUIDE 500
            </h1>

            <p className="text-lg mb-10 text-gray-300 leading-relaxed max-w-2xl">
              Build musical ideas together through a dynamic, growing tree of connected riffs and beats.
              Explore topics, create your own musical branches, and share your creativity with the community.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <div className="border-2 border-yellow-700/30 p-6 hover:scale-105 transition-transform">
                <h2 className="text-xl font-bold mb-3 text-yellow-500">Explore Topics</h2>
                <p className="text-gray-400 mb-4">
                  Dive into existing musical ideas, or find inspiration by exploring others creations.
                </p>
              </div>

              <div className="border-2 border-yellow-700/30 p-6 hover:scale-105 transition-transform">
                <h2 className="text-xl font-bold mb-3 text-yellow-500">Start Your Own</h2>
                <p className="text-gray-400 mb-4">
                  Start a brand new musical journey by creating your own topic. Be the root of something big!
                </p>
              </div>

              <div className="border-2 border-yellow-700/30 p-6 hover:scale-105 transition-transform">
                <h2 className="text-xl font-bold mb-3 text-yellow-500">Collaborate</h2>
                <p className="text-gray-400 mb-4">
                  Contribute to existing riffs, add your sound, and grow the musical network together.
                </p>
              </div>
            </div>

            <div className="border-2 border-yellow-700/30 p-6 mt-12 text-center">
              <h3 className="text-s font-bold text-yellow-500 mb-6">
                COLLABORATORS
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
              <div className="w-24 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/collab1.png" alt="Partner 1" className="object-cover w-full h-full" />
                </div>
                <div className="w-24 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/collab2.png" alt="Partner 2" className="object-cover w-full h-full" />
                </div>
                <div className="w-24 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/collab3.png" alt="Partner 3" className="object-cover w-full h-full" />
                </div>
              </div>
            </div>
            <button 
                  onClick={() => fetchTopics()}
                  className="text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  Refresh
                </button>
          </div>
        </div>
      </div>
    </div>
  );
}