"use client";

import React from "react";
import { MasonryGallery } from "@/components/explore/MasonryGallery";
import { useRootSearch } from "@/components/search/RootSearchContext";
import { ExploreFilters } from "@/components/explore/ExploreFilters";

export default function ExplorePage() {
  const { sorted } = useRootSearch();

  return (
    <>
      <div>
        <ExploreFilters />
        <div className="px-6 py-2 mx-auto">
        {sorted.length > 0 ? (
          <MasonryGallery topics={sorted} />
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            Aucun topic ne correspond aux filtres / à la recherche.
          </p>
        )}
        </div>
      </div>
    </>
  );
}