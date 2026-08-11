"use client";

import { useEffect, useRef } from "react";
import TrackWaveform from "@/components/audio/ui/TrackWaveform";
import { getWaveColorForInstrument } from "@/lib/utils/instrumentColor";
import type { LivePeak } from "@/components/audio/engine/RecorderEngine";

export interface RecorderLane {
  id: string;
  buffer: AudioBuffer;
  title: string;
  instr: string;
  duration: number;
}

export type TakeLane =
  | { mode: "none" }
  | { mode: "live"; peaks: LivePeak[]; version: number }
  | { mode: "static"; buffer: AudioBuffer; duration: number };

interface RecorderTracksProps {
  lanes: RecorderLane[];
  take: TakeLane;
  takeInstr: string;
  totalDuration: number;
  currentTime: number;
  bpm: number;
  beatsPerBar?: number;
  onSeek?: (ratio: number) => void;
}

const TAKE_COLOR = "#fde047"; // yellow-300

// Canvas de la prise en direct : dessine les pics au fil de l'enregistrement,
// positionnés sur le temps musical (aligné avec les pistes parentes).
function LiveTakeCanvas({
  peaks,
  total,
  version,
}: {
  peaks: LivePeak[];
  total: number;
  version: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(1, wrap.clientWidth);
    const cssH = Math.max(1, wrap.clientHeight);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const mid = cssH / 2;
    ctx.fillStyle = TAKE_COLOR;
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i];
      const x = (p.t / total) * cssW;
      const h = Math.max(1.5, p.v * (cssH * 0.9));
      ctx.fillRect(x, mid - h / 2, 2, h);
    }
  }, [peaks, total, version]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

// Vue multipiste "DAW" : pistes parentes + la prise, dans un SEUL ensemble,
// une grille de mesures et une tête de lecture commune.
export function RecorderTracks({
  lanes,
  take = { mode: "none" },
  takeInstr,
  totalDuration,
  currentTime,
  bpm,
  beatsPerBar = 4,
  onSeek,
}: RecorderTracksProps) {
  const total = Math.max(totalDuration, 0.001);
  const playRatio = Math.min(Math.max(currentTime / total, 0), 1);

  const barDur = (60 / (bpm > 0 ? bpm : 120)) * beatsPerBar;
  const barPct = (barDur / total) * 100;

  const takeColor = getWaveColorForInstrument(takeInstr);

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const seekAt = (clientX: number) => {
    const el = trackRef.current;
    if (!el || !onSeek) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    onSeek(ratio);
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        if (!onSeek) return;
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekAt(e.clientX);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) seekAt(e.clientX);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
      }}
      className={`relative rounded-xl border border-white/10 bg-black/30 p-2.5 ${
        onSeek ? "cursor-pointer select-none" : ""
      }`}
    >
      {/* grille de mesures */}
      {barPct > 0.5 && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: `${barPct}% 100%`,
          }}
        />
      )}

      {/* tête de lecture commune */}
      <div
        className="pointer-events-none absolute top-1 bottom-1 z-20 w-[2px] bg-yellow-300/90 shadow-[0_0_6px_rgba(253,224,71,0.8)]"
        style={{ left: `${playRatio * 100}%` }}
      >
        {onSeek && (
          <div className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-yellow-300 shadow" />
        )}
      </div>

      <div className="relative z-10 space-y-1.5">
        {/* PISTES PARENTES */}
        {lanes.map((lane, i) => {
          const color = getWaveColorForInstrument(lane.instr);
          const widthPct = Math.max(4, (lane.duration / total) * 100);
          const laneProgress =
            lane.duration > 0
              ? Math.min(Math.max(currentTime / lane.duration, 0), 1)
              : 0;

          return (
            <div
              key={lane.id}
              className="relative h-14 overflow-hidden rounded-xl bg-white/[0.03]"
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: `${widthPct}%` }}
              >
                <TrackWaveform buffer={lane.buffer} color={color} progress={laneProgress} />
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex flex-col items-end justify-center">
                <span className="text-[10px] font-semibold uppercase leading-tight text-white/90">
                  {lane.title || `Track ${i + 1}`}
                </span>
                <span
                  className="text-[9px] font-medium uppercase leading-tight"
                  style={{ color }}
                >
                  {lane.instr || "unknown"}
                </span>
              </div>
            </div>
          );
        })}

        {/* PRISE (dans le même ensemble) */}
        {take.mode !== "none" && (
          <div className="relative h-14 overflow-hidden rounded-xl bg-yellow-400/[0.07] ring-1 ring-yellow-400/40">
            {take.mode === "live" && (
              <div className="absolute inset-0">
                <LiveTakeCanvas peaks={take.peaks} total={total} version={take.version} />
              </div>
            )}
            {take.mode === "static" && (
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: `${Math.max(4, (take.duration / total) * 100)}%` }}
              >
                <TrackWaveform
                  buffer={take.buffer}
                  color={takeColor}
                  progress={
                    take.duration > 0
                      ? Math.min(Math.max(currentTime / take.duration, 0), 1)
                      : 0
                  }
                />
              </div>
            )}
            <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex flex-col items-end justify-center">
              <span className="text-[10px] font-semibold uppercase leading-tight text-yellow-100">
                {take.mode === "live" ? "● Your take" : "Your take"}
              </span>
              <span
                className="text-[9px] font-medium uppercase leading-tight"
                style={{ color: takeColor }}
              >
                {takeInstr || "unknown"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
