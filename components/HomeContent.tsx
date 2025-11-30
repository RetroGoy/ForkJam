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
    <div className="flex h-screen bg-dot-pattern">
      {/* Main container */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Header + hamburger (mobile only) */}
        <Header />

        {/* Desktop layout */}
        <div className="flex">
          {/* Sticky sidebar on desktop */}
            <Sidebar topics={topics} />

         {/* LANDING PAGE CONTENT */}
          <div className="relative z-10 flex flex-col m-8 mx-12 max-w-5xl w-full">

            {/* 2 columns layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">

              {/* LEFT TEXT SECTION */}
              <div>
                <h1 className="text-5xl font-extrabold text-yellow-500 tracking-tight mb-4">
                  FORK JAM
                </h1>

                <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-xl">
                  A collaborative space where musicians build a living structure
                  of riffs, loops, branches and evolving sound ideas.
                </p>

                <p className="text-gray-400 text-sm">
                  Connect musical pieces together. Grow ideas. Remix the network.
                </p>
              </div>

              {/* RIGHT MINI GRAPH (REACTFLOW STYLE) */}
              <div className="flex justify-center items-center">
                <svg width="300" height="200" className="overflow-visible">

                  {/* NODE 1 */}
                  <rect x="0" y="20" width="110" height="50" rx="1"
                        fill="#3CB371" />
                  <text x="20" y="50" fill="white" fontSize="14" fontWeight="700">Synth Pad</text>

                  {/* NODE 2 */}
                  <rect x="180" y="20" width="110" height="50" rx="1"
                        fill="#D9534F" />
                  <text x="210" y="50" fill="white" fontSize="14" fontWeight="700">Guitar</text>

                  {/* NODE 3 */}
                  <rect x="180" y="110" width="110" height="50" rx="1"
                        fill="#9370DB" />
                  <text x="210" y="140" fill="white" fontSize="14" fontWeight="700">Voices</text>

                  {/* NODE 3 */}
                  <rect x="350" y="110" width="50" height="50" rx="1"
                        fill="oklch(79.5% 0.184 86.047)" />
                  <text x="362" y="147" fill="white" fontSize="40" fontWeight="700">+</text>

                  {/* LINES */}
                  <path d="M110 45 C150 45 150 45 180 45"
                        stroke="oklch(79.5% 0.184 86.047)" strokeWidth="3" fill="none" />
                  <path d="M110 45 C160 45 150 135 180 135"
                        stroke="oklch(79.5% 0.184 86.047)" strokeWidth="3" fill="none" />
                  <path d="M290 135 C300 135 300 135 350 135"
                        stroke="oklch(79.5% 0.184 86.047)" strokeWidth="3" fill="none" />
                </svg>
              </div>

            </div>

            {/* 3 compact cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              <div className="p-5 bg-gray-800/60 border border-yellow-700/30 rounded-lg shadow hover:scale-[1.02] transition-transform">
                <h2 className="text-xl font-bold mb-2 text-yellow-500">Explore</h2>
                <p className="text-gray-400 text-sm">
                  Browse existing topics and discover musical branches.
                </p>
              </div>

              <div className="p-5 bg-gray-800/60 border border-yellow-700/30 rounded-lg shadow hover:scale-[1.02] transition-transform">
                <h2 className="text-xl font-bold mb-2 text-yellow-500">Collaborate</h2>
                <p className="text-gray-400 text-sm">
                  Add your riffs ideas across the network.
                </p>
              </div>

              <div className="p-5 bg-gray-800/60 border border-yellow-700/30 rounded-lg shadow hover:scale-[1.02] transition-transform">
                <h2 className="text-xl font-bold mb-2 text-yellow-500">Create</h2>
                <p className="text-gray-400 text-sm">
                  Start your own topic and watch a new sound tree grow.
                </p>
              </div>

            </div>

            {/* Bottom: feedback */}
            <div className="bg-gray-800/70 border border-yellow-700/30 p-6 rounded-lg shadow-lg mb-4">
              <h3 className="text-yellow-500 font-semibold text-lg mb-3">
                Project in active development
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                ForkJam is improving weekly. More tools, better UI, synced playback,
                audio editing and collaborative routing are coming soon.
                <br/><br/>
                Got ideas or feedback? Let me know:
              </p>

              <a
                className="text-yellow-400 font-medium hover:text-yellow-300 underline"
                href="mailto:n.naveau@icloud.com"
              >
                n.naveau@icloud.com
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}