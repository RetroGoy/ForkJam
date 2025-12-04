"use client";

import { useEffect, useRef } from "react";

export default function TrackWaveform({ buffer }: { buffer: AudioBuffer | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !buffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;

    const samples = buffer.getChannelData(0);

    // Nombre de barres (plus large = plus "TikTok")
    const BAR_WIDTH = 6;
    const GAP = 2;
    const bars = Math.floor(width / (BAR_WIDTH + GAP));

    const step = Math.floor(samples.length / bars);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(250, 204, 21, 0.95)"; // jaune fort

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
  }, [buffer]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={80}
      className="w-full h-full opacity-80"
    />
  );
}