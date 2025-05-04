"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topic } from '@/lib/supabase';
import { useTopicStore } from '@/store/useTopicStore';
import { Header } from '@/components/layout/Header';
import { Plus, Menu } from 'lucide-react';
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

  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  return (
    <div className="flex h-screen">
      {/* Main container */}
      <div className="flex-1 overflow-y-auto bg-gray-800 relative">
        {/* Header + hamburger (mobile only) */}
        <Header />
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-gray-700 hover:bg-gray-600 focus:outline-none"
          aria-label="Toggle sidebar">
          {/* simple hamburger icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop layout */}
        <div className="flex">
          {/* Sticky sidebar on desktop */}
          <div className="hidden md:block sticky top-0 shrink-0">
            <Sidebar topics={topics} />
          </div>

          {/* Main content area */}
          <div className="flex flex-col m-8 mx-12 min-h-full">
            <h1 className="text-5xl font-extrabold mb-6 text-yellow-500">
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

            {/* Collaborators */}
            <div className="border-2 border-yellow-700/30 p-6 mt-12 text-center">
              <h3 className="text-s font-bold text-yellow-500 mb-6">COLLABORATORS</h3>
              <div className="flex flex-wrap justify-center gap-6">
                {/* <div className="w-24 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/collab1.png" alt="Partner 1" className="object-cover w-full h-full" />
                </div>
                <div className="w-24 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/collab2.png" alt="Partner 2" className="object-cover w-full h-full" />
                </div>
                <div className="w-24 h-10 flex items-center justify-center overflow-hidden">
                  <img src="/collab3.png" alt="Partner 3" className="object-cover w-full h-full" />
                </div> */}
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchTopics}
              className="text-yellow-500 hover:text-yellow-400 transition-colors mt-8 self-start"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <>
          {/* Off‑canvas sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 max-w-64 bg-black bg-opacity-70 overflow-y-auto md:hidden">
            <Sidebar topics={topics} />
          </div>

          {/* Semi‑transparent overlay to close */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          />
        </>
      )}
    </div>
  );
}