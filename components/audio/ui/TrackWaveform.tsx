"use client";

import { useEffect, useRef } from "react";

interface TrackWaveformProps {
  buffer: AudioBuffer | null;
  color?: string; // ← NOUVEAU
}

export default function TrackWaveform({ buffer, color = "#facc15" }: TrackWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !buffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;

    const samples = buffer.getChannelData(0);

    // Style (TikTok bars)
    const BAR_WIDTH = 6;
    const GAP = 2;
    const bars = Math.floor(width / (BAR_WIDTH + GAP));
    const step = Math.floor(samples.length / bars);

    ctx.clearRect(0, 0, width, height);

    // 👇 Couleur dynamique
    ctx.fillStyle = color;

    for (let i = 0; i < bars; i++) {
      let peak = 0;

      for (let j = 0; j < step; j++) {
        const s = samples[i * step + j];
        peak = Math.max(peak, Math.abs(s));
      }

      const normalized = peak * (height * 0.9);
      const y = (height - normalized) / 2;

      ctx.fillRect(
        i * (BAR_WIDTH + GAP),
        y,
        BAR_WIDTH,
        normalized
      );
    }
  }, [buffer, color]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={80}
      className="w-full h-full opacity-80"
    />
  );
}