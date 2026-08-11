"use client";

import React from "react";
import { ReactFlowProvider } from "reactflow";
import { AppHeader } from "./AppHeader";
import { PublicHeader } from "./PublicHeader";
import { Sidebar } from "./Sidebar";
import { BottomBar } from "./BottomBar";
import { Footer } from "./Footer";
import type { Session } from "@supabase/supabase-js";
import { ModalProvider } from "@/components/modals/GlobalModal";
import { useSupabaseSession } from "@/store/useSupabaseSession";
import { RootSuggestions } from "@/components/search/RootSuggestions";
import { RecorderHost } from "@/components/recorder/RecorderHost";

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const session = useSupabaseSession();
  const isLogged = !!session;

  return (
    <ModalProvider>
    <ReactFlowProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-dot-pattern">

        {isLogged && (
          <aside className="hidden h-full w-16 shrink-0 flex-col border-r border-border bg-background backdrop-blur md:flex">
            <Sidebar />
          </aside>
        )}

        <div className="flex h-full min-w-0 flex-1 flex-col">

          {isLogged ? <AppHeader /> : <PublicHeader />}

          <main className="relative min-h-0 w-full flex-1 overflow-y-auto">
            {children}
          </main>

          {isLogged && <BottomBar />}
          {isLogged && <RecorderHost />}

            <div className="fixed bottom-0 left-0 right-0 z-30">
              <Footer />
            </div>

        </div>
      </div>
    </ReactFlowProvider>
    </ModalProvider>
  );
}
type UnifiedLayoutProps = {
  session: Session | null;
  children: React.ReactNode;
};
