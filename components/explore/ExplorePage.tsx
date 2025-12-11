"use client";

import React from "react";
import { RootNodeCard } from "@/components/nodes/RootNodeCard";
import { useRootSearch } from "@/components/search/RootSearchContext";
import { InlineRecorderButton } from "@/components/recorder/InlineRecorderButton";

export function ExplorePage() {
  const { sorted } = useRootSearch();

  return (
    <>
      <div className="px-4 py-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Explore</h1>

        {sorted.length > 0 ? (
          <div className="space-y-2">
            {sorted.map((node) => (
              <RootNodeCard key={node.id} node={node} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground mt-8">
            Aucun résultat.
          </div>
        )}
      </div>
    </>
  );
}