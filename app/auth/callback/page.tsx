"use client";

import { useEffect } from "react";
import { useGlobalModal } from "@/components/modals/GlobalModal";

export default function CallbackPage() {
  const { open } = useGlobalModal();

  useEffect(() => {
    open("reset");
  }, [open]);

  return null;
}