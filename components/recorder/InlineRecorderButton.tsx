// components/recorder/InlineRecorderButton.tsx
"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { Node } from "@/lib/supabase/supabase";
import { RecorderModal } from "./RecorderModal";

type BranchNode = {
  id: string;
  audio_url: string | null;
};

interface InlineRecorderButtonProps {
  parentId: string | null;
  isRoot?: boolean;
  bpm?: number | null;

  // pour refresh ton graph / root list
  onCreated?: (node: Node) => void;

  // branch de parents à lire (optionnel si tu veux le gérer ici)
  branch?: BranchNode[];

  // pour customiser un peu le bouton si besoin
  className?: string;
}

export const InlineRecorderButton: React.FC<InlineRecorderButtonProps> = ({
  parentId,
  isRoot = false,
  bpm = null,
  onCreated,
  branch,
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          "w-10 h-10 flex items-center justify-center bg-yellow-700 hover:bg-yellow-600 text-white rounded-sm shadow-md"
        }
      >
        <Plus size={18} />
      </button>

      <RecorderModal
        open={open}
        onClose={() => setOpen(false)}
        parentId={parentId}
        isRoot={isRoot}
        bpm={bpm}
        onCreated={onCreated}
        branch={branch}
      />
    </>
  );
};