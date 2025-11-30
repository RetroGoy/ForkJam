"use client";

// ════════════════════════════════════════════════════════════════
// PART A — Imports, types, hooks
// ════════════════════════════════════════════════════════════════

import React, {
  useState,
  useEffect,
  useRef,
  MouseEvent,
} from "react";
import {
  Plus,
  Save,
  X,
  Mic,
  Square,
  Loader2,
  Play,
  VolumeX,
  Volume2,
  SlidersHorizontal,
  Timer,
  Music2,
  RotateCcw,
  Repeat,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { uploadAudioToSupabase } from "@/lib/uploadAudioToSupabase";
import { createNode } from "@/lib/createNode";
import { createMetronome } from "@/lib/metronome";
import { useAudioStore } from "@/store/useAudioStore";
import { getNodeColor } from "@/lib/getNodeColor";
import type { Node } from "@/lib/supabase";

type RecorderMode = "idle" | "recording" | "editing";

interface InlineNodeRecorderProps {
  parentId: string;
  topicId: string;
  userId: string;
  bpm: number;
  refreshNodes: () => void;
  branchNodes: Node[];
  disableGraph: () => void;
  enableGraph: () => void;
}

// format seconds as mm:ss
const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Hook: audio input devices (mic / USB / soundcard).
 */
function useInputDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

      try {
        // request temp access so enumerateDevices returns full list
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        const list = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = list.filter((d) => d.kind === "audioinput");
        if (!mounted) return;

        setDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedId(audioInputs[0].deviceId);
        }

        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        console.error("Error listing audio devices", err);
        setHasPermission(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = (id: string) => setSelectedId(id || undefined);

  return {
    devices,
    selectedId,
    hasPermission,
    setSelectedId: handleSelect,
  };
}

/**
 * Hook: simple metronome at given BPM with start/stop + pre-roll helper.
 */
function useMetronome(bpm: number) {
  const metroRef = useRef<ReturnType<typeof createMetronome> | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    metroRef.current = createMetronome(bpm);
    return () => {
      if (intervalIdRef.current && metroRef.current) {
        metroRef.current.stop(intervalIdRef.current);
      }
    };
  }, [bpm]);

  const startSimple = (onBeat?: (beat: number) => void) => {
    if (!metroRef.current) return null;
    const id = metroRef.current.start(onBeat);
    intervalIdRef.current = id;
    return id;
  };

  const stop = () => {
    if (intervalIdRef.current && metroRef.current) {
      metroRef.current.stop(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const startPreRoll = async (
    beats: number,
    onUpdate: (beat: number) => void,
    onDone: () => void
  ) => {
    if (!metroRef.current) {
      onDone();
      return;
    }

    let count = 0;
    const id = metroRef.current.start((beat) => {
      count += 1;
      onUpdate(beat);
      if (count >= beats) {
        metroRef.current!.stop(id);
        onDone();
      }
    });
  };

  return { startSimple, stop, startPreRoll };
}

// ════════════════════════════════════════════════════════════════
// PART B — Logic, effets, enregistrement, waveforms
// ════════════════════════════════════════════════════════════════

export function InlineNodeRecorder({
  parentId,
  topicId,
  userId,
  bpm,
  refreshNodes,
  branchNodes = [],
  disableGraph,
  enableGraph,
}: InlineNodeRecorderProps) {
  // UI / état global
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [title, setTitle] = useState("");
  const [instrument, setInstrument] = useState("");
  const [mode, setMode] = useState<RecorderMode>("idle");

  // store audio global
  const playBranch = useAudioStore((s) => s.playBranch);
  const stopAllNodes = useAudioStore((s) => s.stopAllNodes);
  const playingNodes = useAudioStore((s) => s.playingNodes);
  const setGain = useAudioStore((s) => s.setGain);

  // waveforms branch
  const branchWaveformsRef = useRef<Map<string, WaveSurfer>>(new Map());
  const branchDurationsRef = useRef<Record<string, number>>({});
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [trackGains, setTrackGains] = useState<Record<string, number>>({});

  // enregistrement
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStartTimeRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [takeBlob, setTakeBlob] = useState<Blob | null>(null);
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const [takeDuration, setTakeDuration] = useState<number>(0);

  // édition
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [recGain, setRecGain] = useState(1);

  // timeline commune
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  const [isPreRoll, setIsPreRoll] = useState(false);
  const [preRollBeat, setPreRollBeat] = useState<number | null>(null);

  // waveform REC
  const recWaveformRef = useRef<WaveSurfer | null>(null);
  const recRegionsRef = useRef<any | null>(null);
  const recWaveContainerRef = useRef<HTMLDivElement | null>(null);

  // graph audio FX pour REC
  const recAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const lowpassNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [distortionEnabled, setDistortionEnabled] = useState(false);
  const [lowpassEnabled, setLowpassEnabled] = useState(false);

  // timers / RAF
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);

  const MAX_DURATION = 180; // secondes max

  const { devices, selectedId, hasPermission, setSelectedId } = useInputDevices();
  const { stop: stopMetronome, startPreRoll } = useMetronome(bpm);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ───────────────────────────────────────────
  // BRANCH WAVEFORMS (pistes existantes)
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!isClient) return;
    const waveMap = branchWaveformsRef.current;

    // Supprimer les waveforms des nodes qui n'existent plus
    waveMap.forEach((wf, id) => {
      if (!branchNodes.some((n) => n.id === id)) {
        wf.destroy();
        waveMap.delete(id);
        delete branchDurationsRef.current[id];
      }
    });

    // Création / attach des waveforms manquantes
    const frame = requestAnimationFrame(() => {
      branchNodes.forEach((node) => {
        if (!node.audio_url) return;
        if (waveMap.has(node.id)) return; // déjà créé

        const container = document.getElementById(
          `inline-branch-wave-${node.id}`
        );
        if (!container) return;

        const wf = WaveSurfer.create({
          container,
          waveColor: getNodeColor(node.instrument),
          progressColor: "#ffffff",
          barWidth: 2,
          height: 36,
        });

        wf.load(node.audio_url);

        wf.on("ready", () => {
          const d = wf.getDuration();
          branchDurationsRef.current[node.id] = d;
          setDuration((prev) => Math.max(prev, d, takeDuration));
        });

        waveMap.set(node.id, wf);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [branchNodes, isClient, takeDuration]);

  // ───────────────────────────────────────────
  // WAVEFORM REC + REGIONS (trim DAW-style)
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!isClient) return;
    if (!takeUrl || !recWaveContainerRef.current) return;

    if (recWaveformRef.current) {
      recWaveformRef.current.destroy();
      recWaveformRef.current = null;
      recRegionsRef.current = null;
    }

 const wf = WaveSurfer.create({
  container: recWaveContainerRef.current,
  waveColor: "#fbbf24",
  progressColor: "#ffffff",
  barWidth: 2,
  height: 56,
});

// Typage un peu archaïque de wavesurfer.js : on force en any
const regions = wf.registerPlugin(
  (RegionsPlugin as any).create({
    dragSelection: true,
  }) as any
);
recRegionsRef.current = regions;

    wf.load(takeUrl);

    wf.on("ready", () => {
      const d = wf.getDuration();
      setTakeDuration(d);
      setTrimStart(0);
      setTrimEnd(d);
      setDuration((prev) =>
        Math.max(prev, d, ...Object.values(branchDurationsRef.current))
      );

      const region = regions.addRegion({
        start: 0,
        end: d,
        color: "rgba(255, 200, 0, 0.25)",
        drag: true,
        resize: true,
      });

      region.on("update-end", (r: any) => {
        setTrimStart(r.start);
        setTrimEnd(r.end);
      });
    });

    recWaveformRef.current = wf;

    return () => {
      wf.destroy();
      recWaveformRef.current = null;
      recRegionsRef.current = null;
    };
  }, [takeUrl, isClient]);

  // ───────────────────────────────────────────
  // MASTER TICK : lecture, curseur, synchro
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!isClient) return;

    const tick = () => {
      const branchAudios: HTMLAudioElement[] = [];
      branchNodes.forEach((n) => {
        const a = playingNodes.get(n.id);
        if (a) branchAudios.push(a);
      });

      const recAudio = recAudioRef.current;

      const active =
        branchAudios.length > 0 || (!!recAudio && !recAudio.paused && !recAudio.ended);

      setIsPlaying(active);

      if (active) {
        const times = branchAudios.map((a) => a.currentTime || 0);
        const durs = branchAudios.map((a) => a.duration || 0);

        if (recAudio) {
          times.push(recAudio.currentTime + trimStart);
          durs.push(trimEnd || recAudio.duration || 0);
        }

        const maxT = Math.max(...times, 0);
        const maxD = Math.max(duration || 0, ...durs, 0.001);

        setCurrent(maxT);
        const p = Math.min(maxT / maxD, 1);

        // curseur
        if (timelineRef.current && cursorRef.current) {
          const W = timelineRef.current.clientWidth;
          cursorRef.current.style.transform = `translateX(${W * p}px)`;
        }

        // waveforms
        branchWaveformsRef.current.forEach((wf) => wf.seekTo(p));
        if (recWaveformRef.current) {
          const relTime = Math.min(
            Math.max(maxT - trimStart, 0),
            trimEnd - trimStart
          );
          const relP = (relTime || 0) / ((trimEnd - trimStart) || 0.001);
          recWaveformRef.current.seekTo(Math.min(1, Math.max(0, relP)));
        }

        // loop sur la région
        if (loopEnabled && recAudio) {
          const absTime = trimStart + recAudio.currentTime;
          if (absTime >= trimEnd - 0.03) {
            recAudio.currentTime = 0;
            stopAllNodes();
            playBranch(branchNodes);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [
    branchNodes,
    playingNodes,
    duration,
    trimStart,
    trimEnd,
    loopEnabled,
    isClient,
    playBranch,
    stopAllNodes,
  ]);

  // ───────────────────────────────────────────
  // helpers reset / cleanup
  // ───────────────────────────────────────────
  const resetRecordingState = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setIsPreRoll(false);
    setPreRollBeat(null);
  };

  const resetRecAudioGraph = () => {
    try {
      recAudioRef.current?.pause();
      recAudioRef.current = null;
    } catch {
      /* ignore */
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    sourceNodeRef.current = null;
    distortionNodeRef.current = null;
    lowpassNodeRef.current = null;
    gainNodeRef.current = null;
  };

  const fullReset = () => {
    stopMetronome();
    resetRecordingState();
    resetRecAudioGraph();
    stopAllNodes();

    branchWaveformsRef.current.forEach((wf) => wf.destroy());
    branchWaveformsRef.current.clear();
    branchDurationsRef.current = {};

    if (recWaveformRef.current) {
      recWaveformRef.current.destroy();
      recWaveformRef.current = null;
    }

    if (takeUrl) URL.revokeObjectURL(takeUrl);

    setTitle("");
    setInstrument("");
    setTakeBlob(null);
    setTakeUrl(null);
    setTakeDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setLoopEnabled(false);
    setRecGain(1);
    setMuted({});
    setTrackGains({});
    setDistortionEnabled(false);
    setLowpassEnabled(false);
    setDuration(0);
    setCurrent(0);
    setMode("idle");
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      fullReset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FX graph
  const ensureRecAudioGraph = () => {
    if (!takeUrl) return;

    if (!recAudioRef.current) {
      recAudioRef.current = new Audio(takeUrl);
      recAudioRef.current.loop = false;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioCtx = audioContextRef.current;

    if (!sourceNodeRef.current && recAudioRef.current) {
      sourceNodeRef.current = audioCtx.createMediaElementSource(recAudioRef.current);
    }

    if (!distortionNodeRef.current) {
      distortionNodeRef.current = audioCtx.createWaveShaper();
    }
    if (!lowpassNodeRef.current) {
      lowpassNodeRef.current = audioCtx.createBiquadFilter();
      lowpassNodeRef.current.type = "lowpass";
    }
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioCtx.createGain();
    }

    sourceNodeRef.current?.disconnect();
    distortionNodeRef.current?.disconnect();
    lowpassNodeRef.current?.disconnect();
    gainNodeRef.current?.disconnect();

    sourceNodeRef.current
      ?.connect(distortionNodeRef.current!)
      .connect(lowpassNodeRef.current!)
      .connect(gainNodeRef.current!)
      .connect(audioCtx.destination);

    const makeDistortionCurve = (amount: number) => {
      const k = typeof amount === "number" ? amount : 0;
      const n = 44100;
      const curve = new Float32Array(n);
      const deg = Math.PI / 180;
      let i = 0;
      let x: number;
      for (; i < n; ++i) {
        x = (i * 2) / n - 1;
        curve[i] =
          ((3 + k) * x * 20 * deg) /
          (Math.PI + k * Math.abs(x));
      }
      return curve;
    };

    if (distortionNodeRef.current) {
      if (distortionEnabled) {
        distortionNodeRef.current.curve = makeDistortionCurve(400);
        distortionNodeRef.current.oversample = "4x";
      } else {
        distortionNodeRef.current.curve = null;
      }
    }

    if (lowpassNodeRef.current) {
      lowpassNodeRef.current.frequency.value = lowpassEnabled ? 2000 : 20000;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = recGain;
    }
  };

  useEffect(() => {
    ensureRecAudioGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distortionEnabled, lowpassEnabled, recGain, takeUrl]);

  // Mute / gain pistes existantes
  const applyVolumeRules = () => {
    branchNodes.forEach((n) => {
      const gain = trackGains[n.id] ?? 1;
      let v = muted[n.id] ? 0 : gain;
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

  const handleTrackGainChange = (id: string, value: number) => {
    setTrackGains((prev) => ({ ...prev, [id]: value }));
    setGain(id, muted[id] ? 0 : value);
  };

  // Play / stop timeline EDIT
  const handlePlay = () => {
    if (!takeUrl) {
      stopAllNodes();
      playBranch(branchNodes);
      return;
    }

    ensureRecAudioGraph();
    if (!recAudioRef.current) return;

    stopAllNodes();
    recAudioRef.current.pause();
    recAudioRef.current.currentTime = 0;
    playBranch(branchNodes);

    recAudioRef.current
      .play()
      .catch((err) => console.error("Error playing take", err));

    setIsPlaying(true);
  };

  const handleStop = () => {
    stopAllNodes();
    if (recAudioRef.current) {
      recAudioRef.current.pause();
      recAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // scrub timeline
  const handleTimelineClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    const t = p * duration;

    setCurrent(t);

    branchWaveformsRef.current.forEach((wf) => wf.seekTo(p));
    if (recWaveformRef.current) {
      const relTime = Math.min(Math.max(t - trimStart, 0), trimEnd - trimStart);
      const relP = relTime / ((trimEnd - trimStart) || 0.001);
      recWaveformRef.current.seekTo(relP);
    }

    if (isPlaying) {
      branchNodes.forEach((n) => {
        const a = playingNodes.get(n.id);
        if (a) {
          a.currentTime = Math.min(Math.max(t, 0), a.duration || t);
        }
      });
      if (recAudioRef.current) {
        const rel = Math.min(
          Math.max(t - trimStart, 0),
          (trimEnd - trimStart) || t
        );
        recAudioRef.current.currentTime = rel;
      }
    }
  };

  // enregistrement
  const startRecordTimer = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    let elapsed = 0;
    recordTimerRef.current = setInterval(() => {
      elapsed += 1;
      setCurrent(elapsed);
      if (elapsed >= MAX_DURATION) {
        handleStopRecording();
      }
    }, 1000);
  };

  const handleStartRecordingAfterPreRoll = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      toast.error("Micro non disponible");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedId ? { deviceId: { exact: selectedId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      recordChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const durationSec =
          (Date.now() - recordStartTimeRef.current) / 1000;
        const blob = new Blob(recordChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        setTakeBlob(blob);
        setTakeUrl(url);
        setTakeDuration(durationSec);
        setTrimStart(0);
        setTrimEnd(durationSec);
        setMode("editing");
        setIsRecording(false);
        setIsPreRoll(false);
        setPreRollBeat(null);
        stopMetronome();
        stopAllNodes();
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
      };

      recordStartTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setMode("recording");
      setCurrent(0);
      startRecordTimer();

      stopAllNodes();
      playBranch(branchNodes);
    } catch (err) {
      console.error("Error starting recording", err);
      toast.error("Erreur en démarrant l'enregistrement");
      setIsRecording(false);
      setIsPreRoll(false);
    }
  };

  const handleStartRecording = async () => {
    if (!hasPermission) {
      toast.error("Autorise le micro pour enregistrer");
      return;
    }

    setMode("recording");
    setIsPreRoll(true);
    setPreRollBeat(null);
    setCurrent(0);

    startPreRoll(
      4,
      (beat) => {
        setPreRollBeat(beat);
      },
      () => {
        setPreRollBeat(null);
        setIsPreRoll(false);
        handleStartRecordingAfterPreRoll();
      }
    );
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((t) => t.stop());
    }
  };

  const handleReRecord = () => {
    if (takeUrl) URL.revokeObjectURL(takeUrl);
    setTakeBlob(null);
    setTakeUrl(null);
    setTakeDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setLoopEnabled(false);
    resetRecAudioGraph();
    setMode("idle");
  };

  // save node
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!takeBlob || !takeUrl) {
      toast.error("Pas de prise enregistrée");
      return;
    }
    if (!title || !instrument) {
      toast.error("Titre et instrument requis");
      return;
    }

    setIsSaving(true);

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      toast.error("Tu dois être connecté pour créer un node");
      setIsSaving(false);
      return;
    }

    try {
      const audio_url = await uploadAudioToSupabase(takeBlob);
      if (!audio_url) {
        toast.error("Échec de l'upload");
        setIsSaving(false);
        return;
      }

      const payload: any = {
        title,
        instrument,
        audio_url,
        topic_id: topicId,
        parent_node_id: parentId,
        user_id: user.id,
        trim_start: trimStart,
        trim_end: trimEnd,
        gain: recGain,
        has_distortion: distortionEnabled,
        has_lowpass: lowpassEnabled,
      };

      const newNode = await createNode(payload);
      if (!newNode) {
        toast.error("Erreur lors de la création du node");
      } else {
        toast.success("Node créé !");
        await refreshNodes();
        fullReset();
      }
    } catch (err) {
      console.error("Error saving node", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRecorder = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      toast.error("Connecte-toi pour ajouter un node ✨");
      return;
    }
    setIsOpen(true);
  };

  if (!isClient) return null;

  // ════════════════════════════════════════════════════════════════
  // PART C — Rendu JSX (UI / DAW mini)
  // ════════════════════════════════════════════════════════════════

  if (!isOpen) {
    return (
      <button
        onClick={handleOpenRecorder}
        className="w-10 h-10 flex items-center justify-center
                   bg-yellow-700 hover:bg-yellow-600 text-white rounded-sm"
      >
        <Plus size={18} />
      </button>
    );
  }

  return (
    <div
      className="w-full max-w-3xl mt-2 rounded-md bg-black/60 text-gray-100 p-4 space-y-4"
      onMouseEnter={disableGraph}
      onMouseLeave={enableGraph}
      // BLOQUE tous les events pour ReactFlow
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-yellow-500">
            AJOUTER UNE PISTE
          </span>
        </div>
        <button
          onClick={fullReset}
          className="text-red-400 hover:text-red-300"
        >
          <X size={18} />
        </button>
      </div>

      {/* TITLE + INSTRUMENT */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          placeholder="Titre de la prise"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
        />
        <input
          placeholder="Instrument (ex: guitare, voix...)"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
        />
      </div>

      {/* INPUT SELECTION + TIMER / BPM */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-gray-300">
        <div className="flex items-center gap-2 w-full md:w-2/3">
          <span className="whitespace-nowrap">Entrée</span>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
          >
            {devices.length === 0 && (
              <option value="">(aucun micro détecté)</option>
            )}
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || d.deviceId || "Input audio"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-yellow-300 text-xs">{bpm} BPM</div>
        </div>
      </div>

      {/* BRANCH TRACKS (context) */}
      <div className="space-y-2 rounded-md p-2">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Pistes existantes de la branche</span>
        </div>

        {branchNodes.map((node) => (
          <div
            key={node.id}
            className="relative flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
          >
            {/* Volume + hover gain */}
            <div className="relative group">
              <button
                onClick={() => toggleMute(node.id)}
                className="w-7 h-7 flex items-center justify-center 
                           rounded"
              >
                {muted[node.id] ? (
                  <VolumeX size={14} className="text-red-400" />
                ) : (
                  <Volume2 size={14} className="text-green-400" />
                )}
              </button>

              <div
                className="absolute left-1/2 -translate-x-1/2 -top-11 
                           opacity-0 group-hover:opacity-100
                           transition-opacity px-3 py-2 rounded-md border border-gray-700 shadow-lg"
              >
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={trackGains[node.id] ?? 1}
                  onChange={(e) =>
                    handleTrackGainChange(node.id, parseFloat(e.target.value))
                  }
                  className="w-28"
                />
              </div>
            </div>

            {/* Waveform container */}
            <div className="flex-1 min-w-0">
              <div
                id={`inline-branch-wave-${node.id}`}
                className="w-full h-10 rounded-sm overflow-hidden pointer-events-none"
                style={{ transform: "translateZ(0)" }}
              />
            </div>

            {/* Label droit */}
            <div
              className="whitespace-nowrap text-right font-semibold min-w-[140px]"
              style={{ color: getNodeColor(node.instrument) }}
            >
              {node.title}
            </div>
          </div>
        ))}

        {branchNodes.length === 0 && (
          <div className="text-xs text-gray-500 italic">
            Aucune piste dans cette branche pour le moment.
          </div>
        )}
      </div>

      {/* TAKE TRACK + EDITOR */}
      <div className="space-y-3 bg-black-700/10 rounded-md p-3">
        <div className="flex items-center justify-between text-xs text-yellow-200">
          <div className="flex items-center gap-2">
            <span>Nouvelle piste (REC)</span>
            {mode === "recording" && isPreRoll && (
              <span className="text-red-400 flex items-center gap-1">
                <Repeat size={12} />
                Pré-roll&nbsp;
                {preRollBeat !== null ? `(${preRollBeat})` : ""}
              </span>
            )}
            {mode === "recording" && !isPreRoll && (
              <span className="text-green-400">Enregistrement en cours...</span>
            )}
            {mode === "editing" && (
              <span className="text-green-300">
                Mode édition — {formatTime(trimStart)} → {formatTime(trimEnd)}
              </span>
            )}
          </div>

          {mode === "editing" && (
            <button
              onClick={handleReRecord}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600"
            >
              <RotateCcw size={12} />
              Ré-enregistrer
            </button>
          )}
        </div>

        {/* REC waveform */}
        <div className="w-full h-20 bg-red-500/10 rounded-m overflow-hidden">
          <div ref={recWaveContainerRef} className="w-full h-full" />
        </div>

        {takeUrl && (
          <div className="flex flex-col gap-2 text-xs text-gray-300 mt-1">
            <div className="flex items-center justify-between">
              <span>
                Fenêtre sélectionnée : {formatTime(trimStart)} →{" "}
                {formatTime(trimEnd)} (
                {formatTime(Math.max(trimEnd - trimStart, 0))})
              </span>
              <button
                onClick={() => setLoopEnabled((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  loopEnabled
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                <Repeat size={12} />
                Loop
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} />
                <span className="text-gray-400">Effets (REC)</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={distortionEnabled}
                    onChange={(e) => setDistortionEnabled(e.target.checked)}
                    className="accent-yellow-400"
                  />
                  Distortion
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={lowpassEnabled}
                    onChange={(e) => setLowpassEnabled(e.target.checked)}
                    className="accent-yellow-400"
                  />
                  Low-pass
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span>Gain REC</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={recGain}
                  onChange={(e) => setRecGain(parseFloat(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TIMELINE GLOBALE */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative w-full h-10 bg-black/60 border border-gray-800 rounded-md overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 border-r border-gray-800 ${
                i % 4 === 0 ? "bg-gray-900/40" : ""
              }`}
            />
          ))}
        </div>
        <div
          ref={cursorRef}
          className="absolute top-0 bottom-0 w-[2px] bg-yellow-400 pointer-events-none"
          style={{ transform: "translateX(0px)" }}
        />
      </div>

      {/* TRANSPORT + SAVE */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {mode !== "editing" && !isRecording && (
            <button
              onClick={handleStartRecording}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white text-sm font-medium"
            >
              <Mic size={16} />
              <span>Record</span>
            </button>
          )}
          {isRecording && (
            <button
              onClick={handleStopRecording}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-black text-sm font-medium"
            >
              <Square size={16} />
              <span>Stop</span>
            </button>
          )}

          {mode === "editing" && (
            <>
              {!isPlaying ? (
                <button
                  onClick={handlePlay}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-green-700 hover:bg-green-800 text-white text-sm font-medium"
                >
                  <Play size={16} />
                  <span>Play</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium"
                >
                  <Square size={16} />
                  <span>Stop</span>
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={
            isSaving ||
            !takeUrl ||
            !title ||
            !instrument ||
            mode !== "editing"
          }
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}