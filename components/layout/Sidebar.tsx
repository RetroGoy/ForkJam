"use client";

import React, { useState } from "react";
import type { Node } from "@/lib/supabase/supabase";
import TopicList from "@/components/topic/RootList";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface SidebarProps {
  topics: Node[]; // root nodes seulement
}

export function Sidebar({ topics }: SidebarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="
        flex flex-col
        w-[20%] min-w-[250px]
        max-md:w-[30%]
        max-md:min-w-[180px]
        max-md:max-w-[260px]
      "
    >
      {/* MAIN PANEL */}
      <div className="flex-grow overflow-hidden bg-gray-900/60 p-2 mx-2 bg-blur">
        <TopicList initialRoots={topics} />
      </div>

      {/* OTHER APPS */}
      <div className="bg-gray-900/60 p-2 m-2">
        <div className="space-y-3">
          <Link
            href="https://dumatus.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="
              block w-full text-left bg-gray-900/80
              border border-yellow-900/30
              backdrop-blur-sm p-3
              hover:bg-gray-800/80
            "
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