"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRootSearch } from "@/components/search/RootSearchContext";

export function ExploreFilters() {
  const { selectedFilters, setSelectedFilters } = useRootSearch();

  // TES FILTRES ORIGINAUX
  const styleOptions = ["Rock", "Electro", "Jazz", "Experimental", 'Indie', 'Blues', 'Metal', 'Pop', 'Dance', 'House', 
    'Techno', 'Ambiant', 'Classical', 'World', 'Flok', 'Soundtrack', 'Reggae', 'Hip-Hop'] as const;

  const filters = [
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
    { id: "nearby", label: "Position" },
    ...styleOptions.map((s) => ({ id: s.toLowerCase(), label: s })),
  ];

  const toggleFilter = (id: string) => {
    setSelectedFilters((prev: string[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative px-4 py-2">
      
      {/* GRADIENT LEFT */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent" />

      {/* SCROLL LEFT */}
      <button
        onClick={() =>
          document
            .getElementById("explore-filters-scroll")
            ?.scrollBy({ left: -120, behavior: "smooth" })
        }
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 opacity-70 hover:opacity-100"
      >
        <ChevronLeft size={16} />
      </button>

      {/* SCROLLABLE FILTERS */}
      <div
        id="explore-filters-scroll"
        className="flex gap-2 overflow-x-auto no-scrollbar px-6"
      >
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => toggleFilter(f.id)}
            className={`
              text-xs whitespace-nowrap px-3 py-1 rounded-[7px] transition-colors
              ${
                selectedFilters.includes(f.id)
                  ? "bg-yellow-400 text-black"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* GRADIENT RIGHT */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />

      {/* SCROLL RIGHT */}
      <button
        onClick={() =>
          document
            .getElementById("explore-filters-scroll")
            ?.scrollBy({ left: 120, behavior: "smooth" })
        }
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 opacity-70 hover:opacity-100"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}