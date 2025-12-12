"use client";

import { useRootSearch } from "@/components/search/RootSearchContext";
import { NodeCard } from "@/components/nodes/NodeCard";

export function RootSuggestions() {
  const { searchTerm, sorted } = useRootSearch();

  const show = searchTerm.trim() !== "" && sorted.length > 0;
  const suggestions = sorted.slice(0, 3);

  if (!show) return null;

  return (
    <div className="px-4 mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
      {suggestions.map(node => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}