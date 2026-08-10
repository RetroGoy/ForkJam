"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import type { Node } from "@/lib/supabase/supabase";

// Écoute l'event global "forkjam:open-recorder" (boutons Create de la
// sidebar / bottom bar / feed) et ouvre le recorder en mode topic racine.
export function RecorderHost() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("forkjam:open-recorder", onOpen);
    return () => window.removeEventListener("forkjam:open-recorder", onOpen);
  }, []);

  const handleCreated = (node: Node) => {
    setOpen(false);
    if (node?.id) router.push(`/${node.id}`);
  };

  return (
    <RecorderModal
      open={open}
      onClose={() => setOpen(false)}
      isRoot
      parentId={null}
      bpm={120}
      onCreated={handleCreated}
    />
  );
}
