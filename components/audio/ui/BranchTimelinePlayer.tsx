"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "lucide-react";

import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";
import TrackWaveform from "@/components/audio/ui/TrackWaveform";
import type { Node } from "@/lib/supabase/supabase";

interface BranchTimelinePlayerProps {

  selectedNode: Node | null;
  allNodes: Node[];
}

function getWaveColorForInstrument(instr?: string | null): string {
  const val = (instr ?? "").toLowerCase();

  if (!val) return "#a855f7"; // default: purple-500

  if (val.includes("piano") || val.includes("synth")) return "#16a34a"; // green-600
  if (val.includes("guitar") || val.includes("bass")) return "#dc2626"; // red-600
  if (val.includes("drum") || val.includes("perc")) return "#2563eb";   // blue-600
  if (val.includes("sax") || val.includes("trumpet")) return "#f97316"; // orange-500

  return "#a855f7"; // fallback
}

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export function BranchTimelinePlayer({
  selectedNode,
  allNodes,
}: BranchTimelinePlayerProps) {
  const { branch, currentTime, duration, engine } = useAudioEngine();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(800);

  // Map id -> Node pour retrouver instrument / titre
  const nodesById = useMemo(() => {
    const map = new Map<string, Node>();
    allNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [allNodes]);

  // Resize observer pour adapter la largeur
  useEffect(() => {
    if (!containerRef.current) return;

    const update = () => {
      if (!containerRef.current) return;
      setWidth(containerRef.current.clientWidth);
    };
    update();

    const obs = new ResizeObserver(update);
    obs.observe(containerRef.current);

    return () => obs.disconnect();
  }, []);

  // Déplacement du curseur global en fonction de currentTime / duration
  useEffect(() => {
    if (!cursorRef.current || !containerRef.current || duration <= 0) return;

    const ratio = Math.min(currentTime / duration, 1);
    const x = ratio * width;
    cursorRef.current.style.transform = `translateX(${x}px)`;
  }, [currentTime, duration, width]);

  // Rien à afficher si aucun node sélectionné ou pas de branch
  if (!selectedNode || !branch.length || duration === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[90%] max-w-5xl -translate-x-1/2 pointer-events-none">
      <div
        ref={containerRef}
        className="relative w-full rounded-md px-4 py-4 pointer-events-auto"
      >
        {/* CURSEUR VERTICAL GLOBAL */}
        <div
          ref={cursorRef}
          className="absolute top-2 bottom-10 w-[2px] bg-yellow-300/90"
        />

        {/* LISTE DES TRACKS */}
        <div className="space-y-3 pt-1">
          {branch.map((bn, index) => {
            const track = engine?.getTrack(bn.id);
            if (!track) return null;

            const meta = nodesById.get(bn.id) || null;
            const instr = meta?.instrument ?? "Unknown";
            const title = meta?.title ?? `Track ${index + 1}`;
            const waveColor = getWaveColorForInstrument(instr);

            const trackDuration = track.duration || 0.001;
            const ratio = duration > 0 ? trackDuration / duration : 1;
            const trackWidth = Math.max(4, ratio * width);

            return (
              <div
                key={bn.id}
                className="relative h-20 rounded-sm bg-black/30 border border-black/60 overflow-hidden"
              >
                {/* Waveform avec largeur relative */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${trackWidth}px` }}
                >
                  <TrackWaveform buffer={track.buffer} color={waveColor} />
                </div>

                {/* Label par-dessus */}
                <div className="relative z-10 flex h-full items-end justify-between px-3 pb-2 text-[10px] uppercase">
                  <div className="flex flex-col gap-[2px] text-yellow-200/90">
                  </div>
                  <div className="flex flex-col items-end gap-[2px]">
                    <span className="text-[10px] font-semibold text-yellow-100">
                      {title}
                    </span>
                    <span
                      className="text-[9px] font-medium"
                      style={{ color: waveColor }}
                    >
                      {instr}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER TEMPS / BPM */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-300">
          <div className="flex items-center gap-2">
            <Timer size={14} />
            <span className="font-mono text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}