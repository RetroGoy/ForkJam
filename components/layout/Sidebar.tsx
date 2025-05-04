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
    <div className="h-full w-[30%] min-w-[250px] flex flex-col">

      <div className="flex-grow overflow-hidden bg-gray-900/60 p-2 mx-2 bg-blur">
        <h2 className="text-3xl font-bold pl-2 p-0.5 text-primary mb-4 border-2 border-primary text-start">TOPICS</h2>
        <TopicList topics={topics} />
      </div>
      
      <div className=" bg-gray-900/60 p-2 m-2">
          <h3 className="text-3xl font-bold pl-2 p-0.5 text-primary mb-4 border-2 border-primary text-start">NEWS</h3>
          <div className="space-y-3">
            <div className="bg-gray-900/80 border border-yellow-900/30 backdrop-blur-sm rounded-none p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-mono text-green-400">NEXT UPDATE</h4>
                <button className="text-green-400 hover:text-green-300">
                  <ExternalLink size={14} />
                </button>
              </div>
              <p className="text-xs mt-1 text-green-300/70">Sample playback feature coming soon</p>
            </div>
            
            <div className="bg-gray-900/80 border border-yellow-900/30 backdrop-blur-sm rounded-none p-3">
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
      </div>
  );
}