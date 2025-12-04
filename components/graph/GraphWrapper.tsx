"use client";

import React from "react";
import { ReactFlowProvider } from "reactflow";
import { Header } from "../layout/Header";
import { Sidebar } from "../layout/Sidebar";

export function GraphWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ReactFlowProvider>
        <div className="absolute inset-0 z-0">
          {children}
        </div>

        <header className="fixed top-0 left-0 right-0 z-40 pointer-events-auto">
          <Header />
        </header>

        <aside
          className="
            fixed
            top-20
            left-2
            bottom-2
            z-30
            w-72
            max-w-[22vw]
            min-w-[220px]
            overflow-y-auto
            pointer-events-auto
          "
        >
          <Sidebar topics={[]} />
        </aside>
      </ReactFlowProvider>
    </div>
  );
}