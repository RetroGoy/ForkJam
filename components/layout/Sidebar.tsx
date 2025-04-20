"use client";

import React from 'react';
import { Topic } from '@/lib/supabase';
import { TopicList } from '@/components/ui/TopicList';
import { Info, Newspaper, ExternalLink } from 'lucide-react';

interface SidebarProps {
  topics: Topic[];
}

export function Sidebar({ topics }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900 border-r-2 border-yellow-900/50">
      <div className="flex-grow overflow-hidden">
        <div className="p-4 border-b-2 border-yellow-900/50">
          <h2 className="text-xl tracking-[0.3em] font-bold text-yellow-500 mb-4">TOPICS</h2>
          <TopicList topics={topics} />
        </div>
      </div>
      
      <div className="p-4 border-t-2 border-yellow-900/50">
        <div className="mb-4">
          <h3 className="text-lg tracking-[0.2em] font-bold text-yellow-500 mb-3">NEWS</h3>
          <div className="space-y-3">
            <div className="retro-card p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-mono text-green-400">NEXT UPDATE</h4>
                <button className="text-green-400 hover:text-green-300">
                  <ExternalLink size={14} />
                </button>
              </div>
              <p className="text-xs mt-1 text-green-300/70">Sample playback feature coming soon</p>
            </div>
            
            <div className="retro-card p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-mono text-blue-400">OTHER APPS</h4>
                <button className="text-blue-400 hover:text-blue-300">
                  <ExternalLink size={14} />
                </button>
              </div>
              <p className="text-xs mt-1 text-blue-300/70">Explore our creative tools ecosystem</p>
            </div>
          </div>
        </div>
        
        <button className="retro-button w-full py-2 px-4 flex items-center justify-center gap-2">
          <Info size={16} />
          <span>INFOS</span>
        </button>
      </div>
    </div>
  );
}