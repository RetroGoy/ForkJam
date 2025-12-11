"use client";

import React from "react";
import type { Node } from "@/lib/supabase/supabase";
import { RootNodeCard } from "@/components/nodes/RootNodeCard";

interface MasonryGalleryProps {
  topics: Node[];
}

export function MasonryGallery({ topics }: MasonryGalleryProps) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {topics.map((node) => (
        <div key={node.id} className="break-inside-avoid">
          <RootNodeCard node={node} />
        </div>
      ))}
    </div>
  );
}