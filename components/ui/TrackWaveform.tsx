"use client";

import { useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

interface TrackWaveformProps {
  url: string;
  color?: string;
  height?: number;
}

export function TrackWaveform({
  url,
  color = "#999",
  height = 40,
}: TrackWaveformProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wf = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: "#fff",
      barWidth: 2,
      height,
      interact: true,
    });

    wf.load(url);

    wavesurferRef.current = wf;

    return () => {
      wf.destroy();
    };
  }, [url, color, height]);

  return <div ref={containerRef} className="w-full" />;
}