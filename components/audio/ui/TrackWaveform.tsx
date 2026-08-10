"use client";

import { useEffect, useRef } from "react";

interface TrackWaveformProps {
  buffer: AudioBuffer | null;
  color?: string;
  // Portion déjà lue (0..1) : dessinée pleine, le reste est atténué.
  progress?: number;
}

// Waveform "barres" (style DAW), nette (device pixel ratio) et responsive.
export default function TrackWaveform({
  buffer,
  color = "#facc15",
  progress = 0,
}: TrackWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !buffer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const samples = buffer.getChannelData(0);

      const BAR = 3;
      const GAP = 2;
      const bars = Math.max(1, Math.floor(cssW / (BAR + GAP)));
      const step = Math.max(1, Math.floor(samples.length / bars));
      const mid = cssH / 2;
      const playedBars = Math.floor(progress * bars);

      ctx.clearRect(0, 0, cssW, cssH);

      for (let i = 0; i < bars; i++) {
        let peak = 0;
        const start = i * step;
        for (let j = 0; j < step; j++) {
          const s = samples[start + j];
          if (s !== undefined) {
            const a = Math.abs(s);
            if (a > peak) peak = a;
          }
        }
        const h = Math.max(1.5, peak * (cssH * 0.85));
        ctx.globalAlpha = i <= playedBars ? 1 : 0.4;
        ctx.fillStyle = color;
        ctx.fillRect(i * (BAR + GAP), mid - h / 2, BAR, h);
      }
      ctx.globalAlpha = 1;
    };

    draw();
    const obs = new ResizeObserver(draw);
    obs.observe(wrap);
    return () => obs.disconnect();
  }, [buffer, color, progress]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
