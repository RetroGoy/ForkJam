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
  Wand2,
  Timer,
  Headphones,
  Volume2,
  VolumeX,
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
import { RecorderTracks, type RecorderLane, type TakeLane } from "./RecorderTracks";

type RecorderMode = "idle" | "recording" | "editing";

type BranchNode = {
  id: string;
  audio_url: string | null;
};

interface RecorderModalProps {
  open: boolean;
  onClose: () => void;

  parentId: string | null;
  isRoot?: boolean;
  bpm?: number | null;

  initialTitle?: string;
  initialInstrument?: string;

  branch?: BranchNode[];
  parentNodes?: Node[]; // pistes parentes complètes (titre / instrument) pour les lanes

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

const COUNT_IN_BARS = 1;
const BEATS_PER_BAR = 4;
const COUNT_IN_BEATS = COUNT_IN_BARS * BEATS_PER_BAR;

const GENRE_OPTIONS = [
  "rock",
  "electro",
  "jazz",
  "experimental",
  "indie",
  "blues",
  "metal",
  "pop",
  "dance",
  "house",
  "techno",
  "ambiant",
  "classical",
  "world",
  "folk",
  "soundtrack",
  "reggae",
  "hip-hop",
];

type EqBand = "low" | "mid" | "high";

// Courbe lissée (Catmull-Rom -> cubiques) passant par les points.
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// Égaliseur en courbe : 3 points draggables (Low/Mid/High), ±12 dB.
// Double-clic sur un point = reset à 0.
function EqCurve({
  low,
  mid,
  high,
  onChange,
}: {
  low: number;
  mid: number;
  high: number;
  onChange: (band: EqBand, value: number) => void;
}) {
  const W = 260;
  const H = 120;
  const pad = 16;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<EqBand | null>(null);

  const xOf: Record<EqBand, number> = { low: W * 0.2, mid: W * 0.5, high: W * 0.8 };
  const vals: Record<EqBand, number> = { low, mid, high };
  const dbToY = (db: number) => H / 2 - (db / 12) * (H / 2 - pad);
  const yToDb = (y: number) =>
    Math.max(-12, Math.min(12, Math.round(((H / 2 - y) / (H / 2 - pad)) * 12)));

  const pts = [
    { x: 0, y: dbToY(low) },
    { x: xOf.low, y: dbToY(low) },
    { x: xOf.mid, y: dbToY(mid) },
    { x: xOf.high, y: dbToY(high) },
    { x: W, y: dbToY(high) },
  ];
  const line = smoothPath(pts);
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  const moveTo = (clientY: number) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    onChange(dragRef.current, yToDb(y));
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-full w-full touch-none"
      onPointerMove={(e) => moveTo(e.clientY)}
      onPointerUp={(e) => {
        dragRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
      }}
    >
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.12)" />
      {(["low", "mid", "high"] as EqBand[]).map((b) => (
        <line key={b} x1={xOf[b]} y1="0" x2={xOf[b]} y2={H} stroke="rgba(255,255,255,0.05)" />
      ))}

      <path d={area} fill="url(#eqGrad)" />
      <path
        d={line}
        fill="none"
        stroke="#facc15"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />

      {(["low", "mid", "high"] as EqBand[]).map((b) => (
        <g key={b}>
          <circle
            cx={xOf[b]}
            cy={dbToY(vals[b])}
            r="9"
            fill="transparent"
            className="cursor-ns-resize"
            onPointerDown={(e) => {
              dragRef.current = b;
              svgRef.current?.setPointerCapture(e.pointerId);
            }}
            onDoubleClick={() => onChange(b, 0)}
          />
          <circle
            cx={xOf[b]}
            cy={dbToY(vals[b])}
            r="4.5"
            fill="#ffffff"
            className="pointer-events-none"
          />
        </g>
      ))}
    </svg>
  );
}

export const RecorderModal: React.FC<RecorderModalProps> = ({
  open,
  onClose,
  parentId,
  isRoot = false,
  bpm = null,
  initialTitle = "",
  initialInstrument = "",
  branch = [],
  parentNodes = [],
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [instrument, setInstrument] = useState("");
  const [genre, setGenre] = useState("");
  const [metronomeOn, setMetronomeOn] = useState(true);

  const [mode, setMode] = useState<RecorderMode>("idle");
  const [recElapsed, setRecElapsed] = useState(0); // <0 = count-in
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [hasBlob, setHasBlob] = useState(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // traitement
  const [gain, setGainValue] = useState(1);
  const [doNormalize, setDoNormalize] = useState(true);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  const [isSaving, setIsSaving] = useState(false);

  // BPM : éditable pour un topic racine, hérité du parent sinon
  const [rootBpm, setRootBpm] = useState<number>(
    typeof bpm === "number" && bpm > 0 ? bpm : 120
  );
  const bpmVal = isRoot ? rootBpm : typeof bpm === "number" && bpm > 0 ? bpm : 120;

  // pistes parentes décodées -> vue multipiste DAW
  const [lanes, setLanes] = useState<RecorderLane[]>([]);
  // buffer de la prise (traité) affiché comme lane dans l'ensemble
  const [takeLaneBuffer, setTakeLaneBuffer] = useState<AudioBuffer | null>(null);

  const engineRef = useRef<RecorderEngine | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const togglePreviewRef = useRef<() => void>(() => {});

  const audio = useAudioEngine();
  const isPreviewing = audio.isPlaying && mode === "editing";

  // Stoppe l'audio global à l'ouverture + init moteur global
  useEffect(() => {
    if (!open) return;
    audio.init();
    audio.stop();
    audio.setOverdub(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // INIT recorder engine
  useEffect(() => {
    if (!open) return;

    const engine = new RecorderEngine();
    engineRef.current = engine;

    if (waveformRef.current) engine.attachWaveform(waveformRef.current);

    engine.on("record-start", () => {
      setMode("recording");
      setHasBlob(false);
      setRecElapsed(-(COUNT_IN_BEATS * (60 / bpmVal))); // durée du count-in
    });

    engine.on("tick", (elapsed: number) => setRecElapsed(elapsed));

    engine.on("ready", ({ duration, headTrim }: { duration: number; headTrim: number }) => {
      setTrimStart(headTrim);
      setTrimEnd(duration);
      setMode("editing");
      setHasBlob(true);
    });

    engine.on("trim-change", (s: number, e: number) => {
      setTrimStart(s);
      setTrimEnd(e);
    });

    // liste des entrées audio
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
      audio.stop();
      audio.setOverdub(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // re-attache la waveform si le ref arrive après le moteur
  useEffect(() => {
    if (!open) return;
    const engine = engineRef.current;
    if (engine && waveformRef.current) engine.attachWaveform(waveformRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Précharge les pistes parentes -> lanes multipiste (look DAW)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (!branch || branch.length === 0) {
        setLanes([]);
        return;
      }
      await audio.loadBranch(branch);
      if (cancelled) return;
      const eng = audio.engine;
      if (!eng) return;
      const built: RecorderLane[] = [];
      for (const pn of parentNodes) {
        const tr = eng.getTrack(pn.id);
        if (tr) {
          built.push({
            id: pn.id,
            buffer: tr.buffer,
            title: pn.title ?? "Track",
            instr: pn.instrument ?? "unknown",
            duration: tr.duration,
          });
        }
      }
      setLanes(built);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Barre espace = lecture / pause du mix (hors champs de saisie).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || t?.isContentEditable)
        return;
      e.preventDefault();
      togglePreviewRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Recalcule la lane statique de la prise (rapide, sans EQ/reverb) pour l'ensemble.
  useEffect(() => {
    if (mode !== "editing" || !hasBlob) {
      setTakeLaneBuffer(null);
      return;
    }
    const buf = engineRef.current?.buildTakeBuffer({ normalize: doNormalize });
    setTakeLaneBuffer(buf ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hasBlob, trimStart, trimEnd, doNormalize]);

  // ── RECORD (count-in + parents calés sur le temps 1) ──
  const handleStartRecording = async () => {
    const engine = engineRef.current;
    if (!engine) return;

    try {
      audio.stop();
      audio.setOverdub(null);

      // 1) précharge les parents AVANT d'armer (pour un départ précis)
      if (branch.length > 0) await audio.loadBranch(branch);

      // 2) arme l'enregistrement + count-in -> renvoie le temps 1
      const { downbeatTime } = await engine.arm({
        bpm: bpmVal,
        deviceId: selectedDeviceId || undefined,
        countInBars: COUNT_IN_BARS,
        beatsPerBar: BEATS_PER_BAR,
        metronome: metronomeOn,
      });

      // 3) lance les parents EXACTEMENT sur le temps 1
      if (branch.length > 0) audio.playAt(downbeatTime);
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

  // ── PREVIEW = parents + prise, même horloge ──
  const handlePlay = async () => {
    const engine = engineRef.current;
    if (!engine || !engine.hasRecording()) return;

    const take = await engine.buildProcessedTake({
      normalize: doNormalize,
      eqLow,
      eqMid,
      eqHigh,
    });
    if (!take) {
      toast.error("Rien à lire");
      return;
    }

    audio.stop();
    if (branch.length > 0) await audio.loadBranch(branch);
    audio.setOverdub(take.buffer, gain);
    audio.play();
  };

  const handleStopPlay = () => {
    audio.stop();
  };

  const handleGainChange = (v: number) => {
    setGainValue(v);
    audio.setOverdubGain(v); // feedback live pendant la preview
  };

  const handleSave = async () => {
    const engine = engineRef.current;
    if (!engine || !engine.hasRecording()) {
      toast.error("Enregistre une piste avant de sauvegarder");
      return;
    }
    if (!title.trim() || !instrument.trim()) {
      toast.error("Titre et instrument requis");
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

      // traitement final : trim + gain + normalize + EQ -> WAV
      const take = await engine.buildProcessedTake({
        gain,
        normalize: doNormalize,
        eqLow,
        eqMid,
        eqHigh,
      });
      if (!take || take.samples.length < 1024) {
        toast.error("Prise trop courte");
        setIsSaving(false);
        return;
      }
      const wav = engine.encodeWav(take);

      const fileName = `node-${user.id}-${Date.now()}.wav`;
      const publicUrl = await uploadAudio(wav, fileName, "audio/wav");
      if (!publicUrl) {
        toast.error("Échec de l'upload audio");
        setIsSaving(false);
        return;
      }

      const isRootNode = isRoot === true;
      const payload: Partial<Node> = {
        title,
        description: null,
        audio_url: publicUrl,
        instrument,
        parent_node_id: isRootNode ? null : parentId,
        is_root: isRootNode,
        bpm: isRootNode ? bpmVal : null,
        tag: genre || null,
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
      audio.stop();
      audio.setOverdub(null);
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
    audio.setOverdub(null);
    onClose();
  };

  togglePreviewRef.current = () => {
    if (mode !== "editing" || !hasBlob) return;
    if (isPreviewing) handleStopPlay();
    else handlePlay();
  };

  if (!open) return null;

  const takeLen = Math.max(0, trimEnd - trimStart);
  const countingIn = mode === "recording" && recElapsed < 0;

  const mixDuration = lanes.reduce((m, l) => Math.max(m, l.duration), 0);
  const liveElapsed = mode === "recording" ? Math.max(0, recElapsed) : 0;
  const totalDur = Math.max(mixDuration, takeLen, liveElapsed, 0.001);
  const playheadTime =
    mode === "recording" ? Math.max(0, recElapsed) : audio.currentTime;

  // la prise, comme lane du même ensemble : live pendant le record, statique ensuite
  let take: TakeLane = { mode: "none" };
  if (mode === "recording" && !countingIn) {
    const peaks = engineRef.current?.getLivePeaks() ?? [];
    take = { mode: "live", peaks, version: peaks.length };
  } else if (mode === "editing" && takeLaneBuffer) {
    take = { mode: "static", buffer: takeLaneBuffer, duration: takeLen };
  }
  const showTracks = lanes.length > 0 || take.mode !== "none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl">
        {/* COUNT-IN OVERLAY */}
        {countingIn && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-[0.3em] text-yellow-300/80">
              Count-in
            </span>
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-yellow-400/50 text-5xl font-bold text-yellow-400">
              {Math.min(
                COUNT_IN_BEATS,
                Math.max(1, Math.ceil(-recElapsed / (60 / bpmVal)))
              )}
            </div>
          </div>
        )}

        {/* TITLE BAR */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-yellow-500 to-yellow-300 px-5 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black">
              {isRoot ? "Create root track" : "Add branch track"}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-black/70">
              <span className="font-semibold">{bpmVal} BPM</span>
              {branch.length > 0 && (
                <>
                  <span className="text-black/40">·</span>
                  <span>
                    {branch.length} parent{branch.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-black/40">·</span>
                  <Headphones size={12} />
                  <span>headphones</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mode === "recording" && !countingIn && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-bold text-black">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                REC
              </span>
            )}
            {mode === "editing" && (
              <span className="rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-semibold text-black">
                {formatTime(takeLen)}
              </span>
            )}
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-black/60 transition hover:bg-black/10 hover:text-black"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="max-h-[80vh] space-y-4 overflow-y-auto p-5">
          {/* META : titre + instrument + genre */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="Nom de la piste"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/40"
            />
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className={`rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400/60 sm:w-40 ${
                instrument ? "text-white" : "text-white/40"
              }`}
            >
              <option value="" className="bg-neutral-900 text-white/40">
                Instrument…
              </option>
              {INSTRUMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-neutral-900 text-white">
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className={`rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400/60 sm:w-40 ${
                  genre ? "text-white" : "text-white/40"
                }`}
              >
                <option value="" className="bg-neutral-900 text-white/40">
                  Genre…
                </option>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g} className="bg-neutral-900 text-white">
                    {g.toUpperCase()}
                  </option>
                ))}
              </select>
          </div>

          {/* TOOLBAR : entrée + temps */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-white/60">
              <Mic size={13} className="shrink-0 text-white/50" />
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-white/80 outline-none"
              >
                {devices.length === 0 && <option value="">(no input device)</option>}
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId} className="bg-neutral-900">
                    {d.label || d.deviceId || "Audio input"}
                  </option>
                ))}
              </select>
            </label>

            {isRoot && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                <span className="text-[10px] uppercase tracking-wide text-white/50">
                  BPM
                </span>
                <button
                  onClick={() => setRootBpm((b) => Math.max(40, b - 1))}
                  disabled={mode !== "idle"}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 disabled:opacity-30"
                >
                  −
                </button>
                <input
                  type="number"
                  value={rootBpm}
                  disabled={mode !== "idle"}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v)) setRootBpm(Math.min(300, Math.max(40, v)));
                  }}
                  className="w-9 bg-transparent text-center font-mono text-xs text-yellow-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setRootBpm((b) => Math.min(300, b + 1))}
                  disabled={mode !== "idle"}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const next = !metronomeOn;
                setMetronomeOn(next);
                engineRef.current?.setMetronomeMuted(!next);
              }}
              title={metronomeOn ? "Métronome activé (couper le son)" : "Métronome coupé (activer le son)"}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide transition ${
                metronomeOn
                  ? "bg-yellow-400/15 text-yellow-300"
                  : "bg-black/30 text-white/45"
              }`}
            >
              {metronomeOn ? <Volume2 size={12} /> : <VolumeX size={12} />}
              Métro
            </button>

            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/30 px-3 py-1">
              <Timer size={12} className="text-yellow-300/80" />
              <span className="font-mono text-xs text-yellow-200">
                {mode === "recording"
                  ? formatTime(Math.max(0, recElapsed))
                  : `${formatTime(audio.currentTime)} / ${formatTime(takeLen)}`}
              </span>
            </div>
          </div>

          {/* ENSEMBLE MULTIPISTE : parents + prise */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                {countingIn
                  ? "Get ready…"
                  : mode === "recording"
                  ? "Laying down your take…"
                  : "Session"}
              </span>
              {mode !== "recording" && (
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                  {lanes.length} track{lanes.length !== 1 ? "s" : ""}
                  {take.mode !== "none" ? " + take" : ""}
                </span>
              )}
            </div>

            {showTracks ? (
              <RecorderTracks
                lanes={lanes}
                take={take}
                takeInstr={instrument}
                totalDuration={totalDur}
                currentTime={playheadTime}
                bpm={bpmVal}
                onSeek={mode !== "recording" ? (r) => audio.seek(r) : undefined}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-xs text-white/40">
                Appuie sur Record pour poser une première prise
              </div>
            )}

          </div>

          {/* TRAITEMENT — toujours monté (masqué hors édition pour garder la waveform) */}
          <div
            className={
              mode === "editing"
                ? "flex gap-4 rounded-xl border border-white/10 bg-black/20 p-3"
                : "hidden"
            }
          >
            {/* Colonne gauche : Trim, Gain, Normalize */}
            <div className="flex flex-1 flex-col justify-between gap-2.5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                  Trim
                </span>
                <div className="h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 px-1">
                  <div
                    ref={waveformRef}
                    className="h-full w-full"
                    style={{ transform: "translateZ(0)" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  Gain
                </span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={gain}
                  onChange={(e) => handleGainChange(parseFloat(e.target.value))}
                  onDoubleClick={() => handleGainChange(1)}
                  className="h-1.5 flex-1 cursor-pointer accent-yellow-400"
                />
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-yellow-200">
                  {gain.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setDoNormalize((v) => !v)}
                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                  doNormalize
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                <Wand2 size={13} /> Normalize
              </button>
            </div>

            {/* Colonne droite : égaliseur en courbe */}
            <div className="flex w-[46%] shrink-0 flex-col">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                Égaliseur
              </span>
              <div className="mt-1 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <EqCurve
                  low={eqLow}
                  mid={eqMid}
                  high={eqHigh}
                  onChange={(band, v) =>
                    band === "low"
                      ? setEqLow(v)
                      : band === "mid"
                      ? setEqMid(v)
                      : setEqHigh(v)
                  }
                />
              </div>
            </div>
          </div>

          {/* TRANSPORT + SAVE */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {mode !== "recording" && (
                <button
                  onClick={handleStartRecording}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500 sm:flex-none"
                >
                  <Mic size={16} /> {mode === "editing" ? "Re Record" : "Record"}
                </button>
              )}

              {mode === "recording" && (
                <button
                  onClick={handleStopRecording}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300 sm:flex-none"
                >
                  <Square size={16} /> Stop
                </button>
              )}

              {mode === "editing" && hasBlob && !isPreviewing && (
                <button
                  onClick={handlePlay}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Play size={16} className="text-yellow-300" /> Play
                </button>
              )}
              {mode === "editing" && hasBlob && isPreviewing && (
                <button
                  onClick={handleStopPlay}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Square size={16} /> Stop
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                !hasBlob ||
                !title.trim() ||
                !instrument.trim() ||
                (isRoot && !genre) ||
                mode !== "editing"
              }
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-yellow-900/20 transition hover:from-yellow-400 hover:to-yellow-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
