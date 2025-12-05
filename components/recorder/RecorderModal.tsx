// components/recorder/RecorderModal.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Mic,
  Square,
  Play,
  Save,
  Loader2,
  SlidersHorizontal,
  Repeat,
} from "lucide-react";
import toast from "react-hot-toast";

import { RecorderEngine } from "../audio/engine/RecorderEngine";
import {
  supabase,
  uploadAudio,
  type Node,
  createNode,
} from "@/lib/supabase/supabase";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

type RecorderMode = "idle" | "recording" | "editing";

type BranchNode = {
  id: string;
  audio_url: string | null;
};

interface RecorderModalProps {
  open: boolean;
  onClose: () => void;

  // node relations
  parentId: string | null;
  isRoot?: boolean;
  bpm?: number | null;

  // optional initial values (for root creation, etc.)
  initialTitle?: string;
  initialInstrument?: string;

  // branch des parents à lire pendant record / preview
  branch?: BranchNode[];

  onCreated?: (node: Node) => void;
}

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const INSTRUMENT_OPTIONS = [
  "guitar",
  "bass",
  "piano",
  "drums",
  "vocals",
  "synth",
  "pad",
  "strings",
  "brass",
  "saxophone",
  "trumpet",
  "flute",
  "percussion",
  "fx",
  "other",
];

export const RecorderModal: React.FC<RecorderModalProps> = ({
  open,
  onClose,
  parentId,
  isRoot = false,
  bpm = null,
  initialTitle = "",
  initialInstrument = "",
  branch = [],
  onCreated,
}) => {
  const [title, setTitle] = useState(isRoot ? "Root Track" : initialTitle);
  const [instrument, setInstrument] = useState(
    isRoot ? "guitar" : initialInstrument || "guitar"
  );

  const [mode, setMode] = useState<RecorderMode>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const [gain, setGain] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [hasBlob, setHasBlob] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);

  const engineRef = useRef<RecorderEngine | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  // AudioEngine global (parents)
  const audio = useAudioEngine();

  // Stoppe l'audio global dès qu'on ouvre la modale
  useEffect(() => {
    if (open) {
      audio.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // INIT ENGINE (stable)
  useEffect(() => {
    if (!open) return;

    let engine = new RecorderEngine();
    engineRef.current = engine;

    // attach waveform container si déjà rendu
    if (waveformRef.current) {
      engine.attachWaveform(waveformRef.current);
    }

    // events
    engine.on("record-start", () => {
      setMode("recording");
      setCurrentTime(0);
      setDuration(0);
      setHasBlob(false);
    });

    engine.on("record-stop", () => {
      // on attend "ready" pour passer en editing
      console.log("Recorder: record-stop");
    });

    engine.on("ready", (dur: number) => {
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
      setMode("editing");
      setHasBlob(true);
    });

    engine.on("tick", (t: number) => setCurrentTime(t));
    engine.on("trim-change", (s, e) => {
      setTrimStart(s);
      setTrimEnd(e);
    });

    engine.on("play", () => setIsPlaying(true));
    engine.on("stop", () => setIsPlaying(false));

    // load devices
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const list = await navigator.mediaDevices.enumerateDevices();
        const inputs = list.filter((d) => d.kind === "audioinput");
        setDevices(inputs);
        if (inputs[0]) setSelectedDeviceId(inputs[0].deviceId);
        stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.error("Micro error", e);
      }
    })();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [open]);

  // re-attach waveform if ref arrives after engine
  useEffect(() => {
    if (!open) return;
    const engine = engineRef.current;
    if (engine && waveformRef.current) {
      engine.attachWaveform(waveformRef.current);
    }
  }, [open, waveformRef]);

  // Countdown → déclenche record + parents au moment 0
  useEffect(() => {
    if (!open) return;
    if (countdown === null) return;

    if (countdown === 0) {
      setCountdown(null);
      void startRecordingWithParents();
      return;
    }

    const t = setTimeout(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, open]);

  const startRecordingWithParents = async () => {
    const engine = engineRef.current;
    if (!engine) return;

    try {
      setMode("recording");
      setCurrentTime(0);
      setDuration(0);
      setHasBlob(false);

      // charge les parents dans l'audio engine et joue
      if (branch && branch.length > 0) {
        await audio.loadBranch(branch);
        audio.play();
      } else {
        audio.stop();
      }

      await engine.startRecording(
        bpm ?? undefined,
        selectedDeviceId || undefined
        );
    } catch (err) {
      console.error("Error starting recording", err);
      toast.error("Erreur lors de l'accès au micro");
      setMode("idle");
      audio.stop();
    }
  };

const handleStartRecording = async () => {
  const engine = engineRef.current;
  if (!engine) return;

  try {
    setMode("recording");
    setCurrentTime(0);
    setDuration(0);
    setHasBlob(false);

    // BPM réel (depuis ton topic)
    const bpmToUse =
      typeof bpm === "number" && bpm > 0 ? bpm : 120;

    // IMPORTANT : premier argument = BPM, second = deviceId
    await engine.startRecording(bpmToUse, selectedDeviceId || undefined);

  } catch (err) {
    console.error("Error starting recording", err);
    toast.error("Erreur lors de l'accès au micro");
    setMode("idle");
    audio.stop();
  }
};

  const handleStopRecording = () => {
    engineRef.current?.stopRecording();
    audio.stop();
  };

  const handlePlay = async () => {
    if (!hasBlob) return;
    const engine = engineRef.current;
    if (!engine) return;

    // PREVIEW = PARENTS + ENREGISTREMENT
    try {
      if (branch && branch.length > 0) {
        await audio.loadBranch(branch);
        audio.play();
      } else {
        audio.stop();
      }

      engine.play();
    } catch (err) {
      console.error("Error play preview", err);
      toast.error("Erreur lecture preview");
    }
  };

  const handleStopPlay = () => {
    engineRef.current?.stop();
    audio.stop();
  };

  const handleSave = async () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!hasBlob) {
      toast.error("Enregistre une piste avant de sauvegarder");
      return;
    }
    if (!title.trim() || !instrument.trim()) {
      toast.error("Titre et instrument requis");
      return;
    }

    const blob = engine.getBlob();
    if (!blob) {
      toast.error("Aucune prise disponible");
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Tu dois être connecté pour créer un node");
        setIsSaving(false);
        return;
      }

      // upload audio file
      const fileName = `node-${user.id}-${Date.now()}.webm`;
      const publicUrl = await uploadAudio(blob, fileName);
      if (!publicUrl) {
        toast.error("Échec de l'upload audio");
        setIsSaving(false);
        return;
      }

      const { start, end } = engine.getTrim();
      const isRootNode = isRoot === true;
      const parent = isRootNode ? null : parentId;

      const payload: Partial<Node> = {
        title,
        description: null,
        audio_url: publicUrl,
        instrument,
        parent_node_id: parent,
        is_root: isRootNode,
        bpm: isRootNode ? bpm ?? 120 : null,
        tag: null,
        location: null,
        note: 0,
        user_id: user.id,
      };

      const newNode = await createNode(payload);
      if (!newNode) {
        toast.error("Erreur lors de la création du node");
        setIsSaving(false);
        return;
      }

      toast.success("Node créé !");
      onCreated?.(newNode);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error("Error saving node", err);
      toast.error("Erreur lors de la sauvegarde");
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    audio.stop();
    onClose();
  };

  if (!open) return null;

  const hasRecording = hasBlob;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-3xl rounded-md bg-black/80 border border-gray-700 p-4 shadow-2xl relative">
        {/* CLOSE */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-yellow-400">
              {isRoot ? "CREATE ROOT TRACK" : "ADD BRANCH TRACK"}
            </span>
            {typeof bpm === "number" && (
              <span className="text-[11px] text-gray-400">
                BPM:{" "}
                <span className="text-yellow-300 font-semibold">{bpm}</span>
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {mode === "recording" && (
              <span className="text-red-400 flex items-center gap-1">
                <Repeat size={12} /> Recording…
              </span>
            )}
            {mode === "editing" && (
              <span className="text-green-300">
                Editing – {formatTime(trimStart)} → {formatTime(trimEnd)}
              </span>
            )}
          </div>
        </div>

        {/* COUNTDOWN OVERLAY */}
        {countdown !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="text-5xl font-bold text-yellow-400">
              {countdown === 0 ? "GO" : countdown}
            </div>
          </div>
        )}

        {/* TITLE + INSTRUMENT */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input
            placeholder="Track title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            {INSTRUMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* INPUT + TIMER + MONITOR */}
        <div className="flex flex-col md:flex-row gap-3 mb-3 text-xs text-gray-300 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-2/3">
            <span className="whitespace-nowrap">Input</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
            >
              {devices.length === 0 && (
                <option value="">(no input device)</option>
              )}
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || d.deviceId || "Audio input"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-yellow-300">
              <span className="text-[11px] uppercase tracking-wide">TIME</span>
              <span className="font-mono text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* WAVEFORM */}
        <div className="mb-3">
          <div className="w-full h-24 bg-black/60 border border-gray-800 rounded-md overflow-hidden">
            <div
              ref={waveformRef}
              className="w-full h-full"
              style={{ transform: "translateZ(0)" }}
            />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between mt-2">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {mode !== "recording" && (
              <button
                onClick={handleStartRecording}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white text-sm font-medium"
                disabled={countdown !== null}
              >
                <Mic size={16} />
                <span>Record</span>
              </button>
            )}

            {mode === "recording" && (
              <button
                onClick={handleStopRecording}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium"
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            )}

            {mode === "editing" && hasRecording && (
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
                    onClick={handleStopPlay}
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
              !hasRecording ||
              !title.trim() ||
              !instrument.trim() ||
              mode !== "editing"
            }
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Save Track</span>
          </button>
        </div>
      </div>
    </div>
  );
};