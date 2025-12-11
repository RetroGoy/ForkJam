"use client";

import React from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRootSearch } from "@/components/search/RootSearchContext";

export function GlobalSearchBar() {
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useRootSearch();

  return (
    <div className="relative w-full rounded-xl">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={18}
      />
      <input
        type="text"
        placeholder="Search topics..."
        className="w-full rounded-xl border border-border bg-input pl-10 pr-3 py-2 text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && router.push("/explore")}
      />
    </div>
  );
}