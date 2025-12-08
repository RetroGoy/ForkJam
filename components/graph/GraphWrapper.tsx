"use client";

import React, { useState, useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { Header } from "../layout/Header";
import { Sidebar } from "../layout/Sidebar";
import { X } from "lucide-react";

export function GraphWrapper({ children }: { children: React.ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar((s) => !s);

  // Empêche le scroll sur mobile quand sidebar ouverte
  useEffect(() => {
    document.body.style.overflow = showSidebar ? "hidden" : "auto";
  }, [showSidebar]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dot-pattern">
      <ReactFlowProvider>

        {/* HEADER */}
        <header className="fixed top-0 left-0 right-0 z-40 pointer-events-auto">
          <Header onToggleSidebar={toggleSidebar} />
        </header>

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block fixed top-20 left-2 bottom-2 z-30 w-72 max-w-[22vw] min-w-[220px] overflow-y-auto">
          <Sidebar topics={[]} />
        </aside>

        {/* MOBILE SIDEBAR */}
        <aside
          className={`
            fixed inset-0 z-50 md:hidden
            bg-gray-900/80 backdrop-blur-xl
            transform transition-transform duration-300
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar topics={[]} />

          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 text-yellow-300 bg-black/40 p-2 rounded"
          >
            <X size={28} />
          </button>
        </aside>

        {/* MAIN CONTENT (TOPICCONTENT) */}
        <div className="absolute inset-0 z-0 md:ml-[260px] pt-20">
          {children}
        </div>

      </ReactFlowProvider>
    </div>
  );
}