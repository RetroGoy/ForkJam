"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { X } from "lucide-react";

export function ResponsiveSidebarLayout({
  children,
  topics,
}: {
  children: React.ReactNode;
  topics: any[];
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((s) => !s);

  // Lock scroll in mobile overlay
  useEffect(() => {
    document.body.style.overflow = showSidebar ? "hidden" : "auto";
  }, [showSidebar]);

  return (
    <div className="flex h-screen bg-dot-pattern">
      <div className="flex-1 overflow-y-auto relative">

        {/* HEADER */}
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex">

          {/* SIDEBAR DESKTOP */}
          <div className="hidden md:block">
            <Sidebar topics={topics} />
          </div>

          {/* SIDEBAR MOBILE OVERLAY */}
          <div
            className={`
              fixed inset-0 z-40 md:hidden
              bg-background/80 backdrop-blur-xl
              transform transition-transform duration-300
              ${showSidebar ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <Sidebar topics={topics} />

            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 text-yellow-300 bg-black/40 p-2 rounded"
            >
              <X size={24} />
            </button>
          </div>

          {/* PAGE CONTENT */}
          <div className="relative z-10 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}