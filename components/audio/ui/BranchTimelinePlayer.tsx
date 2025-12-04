"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";
import TrackWaveform from "@/components/audio/ui/TrackWaveform";

export function BranchTimelinePlayer({ sidebarWidth }: { sidebarWidth: number }) {
  const { branch, currentTime, duration, engine, isPlaying } = useAudioEngine();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  // Resize observer pour récupérer la largeur réelle
  useEffect(() => {
    if (!containerRef.current) return;

    const update = () => setWidth(containerRef.current!.clientWidth);
    update();

    const obs = new ResizeObserver(update);
    obs.observe(containerRef.current);

    return () => obs.disconnect();
  }, []);

  if (!branch.length || duration === 0) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-0 flex flex-col justify-center pointer-events-none"
      style={{ width: `calc(100vw - ${sidebarWidth}px)` }}
    >
      <div ref={containerRef} className="relative w-full max-w-5xl mx-auto space-y-4 px-8 py-4">

        {/* CURSEUR GLOBAL */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-yellow-300 opacity-90"
          style={{ left: `${(Math.min(currentTime, duration) / duration) * width}px` }}
        />

        {/* TRACKS */}
        {branch.map((bn, index) => {
          const track = engine?.getTrack(bn.id);
          if (!track) return null;

          const trackDuration = track.duration;
          const trackWidth = Math.max(2, (trackDuration / duration) * width);

          return (
            <div
              key={bn.id}
              className="relative h-20 rounded-sm bg-black/40 border border-black/40 overflow-hidden"
              style={{ width: "100%" }}>

              <div
                className="absolute inset-y-0 bg-black/30 overflow-hidden"
                style={{ width: trackWidth }}>
                <TrackWaveform buffer={track.buffer} />
              </div>

              <div className="relative z-10 p-2 text-[10px] text-yellow-200 uppercase">
                Track {index + 1} — {trackDuration.toFixed(2)}s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}