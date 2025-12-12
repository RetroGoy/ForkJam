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

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const session = useSupabaseSession();
  const isLogged = !!session;

  return (
    <ModalProvider>
    <ReactFlowProvider>
      <div className="flex h-screen w-screen bg-dot-pattern overflow-y-auto">

        {isLogged && (
          <aside className="hidden md:flex md:flex-col h-full w-16 border-r border-border bg-background backdrop-blur">
            <Sidebar />
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full">

          {isLogged ? <AppHeader /> : <PublicHeader />}
          {isLogged && <RootSuggestions />}

          <main className="flex-1 min-h-0 w-full relative">
            {children}
          </main>

          {isLogged && <BottomBar />}

          {!isLogged && (
            <footer className="absolute fixed bottom-0 left-0 right-0 z-30">
              <Footer />
            </footer>
          )}

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
