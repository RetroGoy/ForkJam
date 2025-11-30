"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Square, VolumeX, Volume2, Timer } from "lucide-react";
import { getBranchFrom } from "@/lib/audioUtils";
import { useAudioStore } from "@/store/useAudioStore";
import { getNodeColor } from "@/lib/getNodeColor";
import type { Node } from "@/lib/supabase";

interface Props {
  selectedNode: Node | null;
  allNodes: Node[];
  topicBpm: number;
}

export function BranchTimelinePlayer({ selectedNode, allNodes, topicBpm }: Props) {
  const playBranch = useAudioStore((s) => s.playBranch);
  const stopAllNodes = useAudioStore((s) => s.stopAllNodes);
  const playingNodes = useAudioStore((s) => s.playingNodes);
  const setGain = useAudioStore((s) => s.setGain);

  const [branch, setBranch] = useState<Node[]>([]);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const waveforms = useRef<Map<string, WaveSurfer>>(new Map());
  const nodeDurations = useRef<Record<string, number>>({});

  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [soloId, setSoloId] = useState<string | null>(null);

  // ---- BRANCH INIT ----
  useEffect(() => {
    if (!selectedNode) return;
    const b = getBranchFrom(allNodes, selectedNode.id);
    setBranch(b);
  }, [selectedNode, allNodes]);

  // ---- INIT WAVEFORMS (SAFE FOR PRODUCTION) ----
useEffect(() => {
  if (branch.length === 0) return;
  if (typeof window === "undefined") return;

  // Laisser le DOM se stabiliser (ReactFlow + hydration)
  const timeout = setTimeout(() => {
    // Clean
    waveforms.current.forEach((wf) => wf.destroy());
    waveforms.current.clear();
    nodeDurations.current = {};
    setDuration(0);

    // Recreate waveforms
    branch.forEach((node) => {
      const container = document.getElementById(`wave-${node.id}`);
      if (!container) return; // prod-friendly

      const wf = WaveSurfer.create({
        container,
        waveColor: getNodeColor(node.instrument),
        progressColor: "#fff",
        barWidth: 2,
        height: 40,
      });

      wf.load(node.audio_url);

      wf.on("ready", () => {
        nodeDurations.current[node.id] = wf.getDuration();
        setDuration((old) =>
          Math.max(old, nodeDurations.current[node.id] || 0)
        );
      });

      waveforms.current.set(node.id, wf);
    });
  }, 150); // ← 150ms suffit. 200 si tu veux blindé.

  return () => clearTimeout(timeout);
}, [branch]);

  // ---- MASTER TICK (drives cursor + waveforms) ----
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const audios = branch
        .map((n) => playingNodes.get(n.id))
        .filter((a): a is HTMLAudioElement => !!a);

      const active = audios.length > 0;
      setIsPlaying(active);

      if (active) {
        const times = audios.map((a) => a.currentTime || 0);
        const durs = audios.map((a) => a.duration || 0);

        const maxT = Math.max(...times, 0);
        const maxD = Math.max(...durs, duration);

        setCurrent(maxT);
        setDuration(maxD);

        const p = Math.min(maxT / maxD, 1);

        moveCursor(p);
        waveforms.current.forEach((wf) => wf.seekTo(p));
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [branch, playingNodes, duration]);

  // ---- CURSOR LOGIC ----
  const moveCursor = (p: number) => {
    if (!timelineRef.current || !cursorRef.current) return;
    const W = timelineRef.current.clientWidth;
    cursorRef.current.style.transform = `translateX(${W * p}px)`;
  };

  const seekTo = (p: number) => {
    const newTime = p * duration;
    setCurrent(newTime);
    moveCursor(p);

    branch.forEach((node) => {
      const audio = playingNodes.get(node.id);
      if (audio) audio.currentTime = Math.min(audio.duration, newTime);
    });

    waveforms.current.forEach((wf) => wf.seekTo(p));
  };

  // ---- PLAY / STOP ----
  const restartPlayback = () => {
    stopAllNodes();
    setCurrent(0);
    moveCursor(0);
    waveforms.current.forEach((wf) => wf.seekTo(0));
    playBranch(branch);
  };

  const togglePlay = () => {
    const somePlaying = branch.some((n) => playingNodes.has(n.id));
    if (somePlaying) restartPlayback();
    else playBranch(branch);
  };

  // ---- MUTE / SOLO ----
  const applyVolumeRules = () => {
    branch.forEach((n) => {
      let v = 1;
      if (soloId && n.id !== soloId) v = 0;
      if (muted[n.id]) v = 0;
      setGain(n.id, v);
    });
  };

  const toggleMute = (id: string) => {
    setMuted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
    setTimeout(applyVolumeRules, 0);
  };

  if (!selectedNode || branch.length === 0) return null;

  const format = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl p-4 z-50 space-y-4">

      {/* TIMELINE */}
      <div ref={timelineRef} className="relative w-full h-60 overflow-hidden">

        <div className="absolute inset-0 p-3 space-y-3">
          {branch.map((node) => (
            <div key={node.id} className="flex items-center gap-3">

              <div className="flex-1">
                <div id={`wave-${node.id}`} className="w-full h-20" />
              </div>

              <div
                className="text-xs font-semibold min-w-[120px] text-right"
                style={{ color: getNodeColor(node.instrument) }}
              >
                {node.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Timer size={14} />
          {format(current)}
        </div>
        <div>{topicBpm} BPM</div>
      </div>
    </div>
  );
}