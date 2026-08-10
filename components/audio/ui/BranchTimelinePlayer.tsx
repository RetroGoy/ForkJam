"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "lucide-react";

import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";
import TrackWaveform from "@/components/audio/ui/TrackWaveform";
import { getWaveColorForInstrument } from "@/lib/utils/instrumentColor";
import type { Node } from "@/lib/supabase/supabase";

interface BranchTimelinePlayerProps {
  selectedNode: Node | null;
  allNodes: Node[];
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

  const nodesById = useMemo(() => {
    const map = new Map<string, Node>();
    allNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [allNodes]);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!cursorRef.current || !containerRef.current || duration <= 0) return;
    const ratio = Math.min(currentTime / duration, 1);
    cursorRef.current.style.transform = `translateX(${ratio * width}px)`;
  }, [currentTime, duration, width]);

  if (!selectedNode || !branch.length || duration === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 w-[90%] max-w-5xl -translate-x-1/2">
      <div
        ref={containerRef}
        className="pointer-events-auto relative w-full rounded-2xl border border-white/10 bg-black/50 p-4 shadow-2xl backdrop-blur-md"
      >
        <div
          ref={cursorRef}
          className="absolute left-4 top-3 bottom-14 z-20 w-[2px] bg-yellow-300/90 shadow-[0_0_6px_rgba(253,224,71,0.8)]"
        />

        <div className="space-y-1.5">
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
            const progress =
              trackDuration > 0
                ? Math.min(Math.max(currentTime / trackDuration, 0), 1)
                : 0;

            return (
              <div
                key={bn.id}
                className="relative h-16 overflow-hidden rounded-xl bg-white/[0.03]"
              >
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${trackWidth}px` }}
                >
                  <TrackWaveform
                    buffer={track.buffer}
                    color={waveColor}
                    progress={progress}
                  />
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-3 z-10 flex flex-col items-end justify-center">
                  <span className="text-[11px] font-semibold uppercase leading-tight text-white/90">
                    {title}
                  </span>
                  <span
                    className="text-[9px] font-medium uppercase leading-tight"
                    style={{ color: waveColor }}
                  >
                    {instr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80">
            <Timer size={13} className="text-yellow-300/80" />
            <span className="font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
