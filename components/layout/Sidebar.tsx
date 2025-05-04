"use client";

import React, { useState } from 'react';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { Topic } from '@/lib/supabase';
import TopicList from "@/components/ui/TopicList";
import Link from 'next/link';
import { Info, Newspaper, ExternalLink } from 'lucide-react';

interface SidebarProps {
  topics: Topic[];
}

export function Sidebar({ topics }: SidebarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="h-full w-[30%] min-w-[250px] flex flex-col">

      <div className="flex-grow overflow-hidden bg-gray-900/60 p-2 mx-2 bg-blur">
        <h2 className="text-3xl font-bold pl-2 p-0.5 text-primary mb-4 border-2 border-primary text-start">TOPICS</h2>
        <TopicList topics={topics} />
      </div>
      
      <div className=" bg-gray-900/60 p-2 m-2">
          <div className="space-y-3">
            <button onClick={() => setModalOpen(true)} className="w-full text-left bg-gray-900/80 border border-yellow-900/30 backdrop-blur-sm p-3 hover:bg-gray-800/80">
              <div className="flex justify-between items-start">
                <h4 className="font-mono text-green-400">FEEDBACK</h4>
                <ExternalLink size={14} className="mt-0.5 text-green-400" />
              </div>
              <p className="text-xs mt-1 text-green-300/70">
                Sample playback feature coming soon
              </p>
            </button>
            
            <Link
              href="https://dumatus.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-left bg-gray-900/80 border border-yellow-900/30 backdrop-blur-sm p-3 hover:bg-gray-800/80"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-mono text-blue-400">OTHER APPS</h4>
                <ExternalLink size={14} className="mt-0.5 text-blue-400" />
              </div>
              <p className="text-xs mt-1 text-blue-300/70">
                Explore our creative tools ecosystem
              </p>
            </Link>
  
          </div>
        </div>
      </div>
  );
}