"use client";

import React from "react";
import { ArrowRight, User } from "lucide-react";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { useRouter } from "next/navigation";

export function AppHeader() {
  const router = useRouter();

  return (
    <header className="flex items-center gap-3 h-14 bg-background/60 backdrop-blur px-4">
      
      {/* Search */}
      <div className="flex-1 min-w-0">
        <GlobalSearchBar />
      </div>

      {/* Enter */}
      <button
        onClick={() => router.push("/explore")}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80"
      >
        <ArrowRight size={20} />
      </button>

      {/* Profile */}
      <button
        onClick={() => router.push("/profil")}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80"
      >
        <User size={20} />
      </button>

    </header>
  );
}