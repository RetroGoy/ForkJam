"use client";

import { useAudioEngine } from "./hooks/useAudioEngine";
import { useEffect } from "react";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audio = useAudioEngine();

  useEffect(() => {
    audio.init();
  }, []);

  return children;
}