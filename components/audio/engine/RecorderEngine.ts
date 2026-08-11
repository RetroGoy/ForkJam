// components/audio/engine/RecorderEngine.ts
// ------------------------------------------------------------
// Enregistrement calé sur l'horloge audio partagée + METERING LIVE.
//
// Chaîne : getUserMedia -> MediaStreamSource -> MediaStreamDestination
//          -> MediaRecorder   (et -> AnalyserNode pour la waveform live)
//
// Synchro : count-in programmé sur ctx.currentTime, le "temps 1"
// (downbeatTime) est renvoyé pour lancer les parents dessus. leadOffset
// = durée de prise avant le temps 1.
//
// Après stop : on décode, on rogne la tête (leadOffset + latence) pour
// que la prise ALIGNÉE démarre pile au temps 1 -> elle s'intègre comme
// une lane du même multipiste que les parents. Le WAV sauvegardé est
// cette version alignée + trim + gain + normalize.
// ------------------------------------------------------------

import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

import {
  getAudioContext,
  resumeAudioContext,
  getOutputLatency,
} from "@/lib/audio/audioContext";
import { Metronome } from "@/lib/audio/metronome";
import {
  toMono,
  sliceMono,
  applyGain,
  normalize,
  hardClip,
} from "@/lib/audio/process";
import { renderEq } from "@/lib/audio/render";
import { encodeWavMono } from "@/lib/audio/wav";

export type TakeFx = {
  gain?: number;
  normalize?: boolean;
  eqLow?: number;
  eqMid?: number;
  eqHigh?: number;
};

export type RecorderEvent =
  | "ready" // { duration, headTrim }
  | "record-start"
  | "record-stop"
  | "tick" // elapsed seconds (depuis le temps 1, <0 = count-in)
  | "trim-change"; // (start, end)

type Listener = (...args: any[]) => void;

export type LivePeak = { t: number; v: number };

export type ProcessedTake = {
  buffer: AudioBuffer;
  samples: Float32Array;
  sampleRate: number;
};

export class RecorderEngine {
  private ctx: AudioContext;
  private metro: Metronome;

  // --------- recording graph -----------
  private stream: MediaStream | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private analyser: AnalyserNode | null = null;
  private meterBuf: Float32Array = new Float32Array(1024);
  private mediaRecorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  private mime = "audio/webm";

  // --------- timing / sync -------------
  private recStartCtxTime = 0;
  private downbeatTime = 0;
  private leadOffset = 0;
  private latencyCal: number;

  // --------- live metering -------------
  private livePeaks: LivePeak[] = [];

  // --------- audio data (aligné) -------
  private blob: Blob | null = null;
  private audioURL: string | null = null; // WAV aligné (pour wavesurfer)
  private alignedSamples: Float32Array | null = null;
  private alignedSR = 44100;
  private alignedDuration = 0;

  // --------- trim (relatif au clip aligné) ---
  private headTrim = 0;
  private trimStart = 0;
  private trimEnd = 0;

  // --------- waveform (UI trim) --------
  private waveform: WaveSurfer | null = null;
  private regions: any = null;

  private raf: number | null = null;

  private listeners: Record<RecorderEvent, Listener[]> = {
    ready: [],
    "record-start": [],
    "record-stop": [],
    tick: [],
    "trim-change": [],
  };

  constructor() {
    this.ctx = getAudioContext();
    this.metro = new Metronome(this.ctx);
    this.latencyCal = getOutputLatency(this.ctx) + 0.02;
  }

  on(event: RecorderEvent, cb: Listener) {
    this.listeners[event].push(cb);
  }
  private emit(event: RecorderEvent, ...args: any[]) {
    for (const cb of this.listeners[event]) cb(...args);
  }

  setLatencyCal(sec: number) {
    this.latencyCal = sec;
  }
  getLatencyCal() {
    return this.latencyCal;
  }

  setMetronomeMuted(muted: boolean) {
    this.metro.setMuted(muted);
  }

  // ─────────────────────────────────────────────────────────────
  // WAVEFORM (UI de trim uniquement)
  // ─────────────────────────────────────────────────────────────
  attachWaveform(container: HTMLElement) {
    this.cleanupWaveform();

    this.waveform = WaveSurfer.create({
      container,
      waveColor: "#fde047",
      progressColor: "#ffffff",
      barWidth: 2,
      height: 48,
    });

    const plugin = (RegionsPlugin as any).create({ dragSelection: false });
    this.regions = this.waveform.registerPlugin(plugin);

    this.waveform.on("ready", () => {
      this.alignedDuration = this.waveform!.getDuration();
      if (this.trimEnd <= 0) this.trimEnd = this.alignedDuration;
      this.drawRegion();
    });

    if (this.audioURL) this.waveform.load(this.audioURL);
  }

  private drawRegion() {
    if (!this.regions) return;
    this.regions.clearRegions();
    const region = this.regions.addRegion({
      start: this.trimStart,
      end: this.trimEnd,
      color: "rgba(255, 200, 0, 0.18)",
      drag: true,
      resize: true,
    });
    region.on("update-end", (r: any) => this.setTrim(r.start, r.end));
  }

  // ─────────────────────────────────────────────────────────────
  // RECORDING
  // ─────────────────────────────────────────────────────────────
  async arm(opts: {
    bpm?: number;
    deviceId?: string;
    countInBars?: number;
    beatsPerBar?: number;
    metronome?: boolean;
  }): Promise<{ downbeatTime: number }> {
    const ctx = await resumeAudioContext();
    const bpm = opts.bpm && opts.bpm > 0 ? opts.bpm : 120;
    const countInBars = opts.countInBars ?? 1;

    this.metro = new Metronome(ctx, bpm, opts.beatsPerBar ?? 4);
    this.metro.setMuted(opts.metronome === false);
    this.cleanupRecorder();
    this.livePeaks = [];

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };
    if (opts.deviceId) audioConstraints.deviceId = { exact: opts.deviceId };

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });
    this.stream = stream;

    // graphe d'entrée : source -> dest (record) et source -> analyser (live)
    this.inputSource = ctx.createMediaStreamSource(stream);
    this.dest = ctx.createMediaStreamDestination();
    this.inputSource.connect(this.dest);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.meterBuf = new Float32Array(this.analyser.fftSize);
    this.inputSource.connect(this.analyser);

    this.mime = this.pickMime();
    const recorder = new MediaRecorder(this.dest.stream, {
      mimeType: this.mime,
      audioBitsPerSecond: 128000,
    });
    this.mediaRecorder = recorder;
    this.recordChunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordChunks.push(e.data);
    };
    recorder.onstop = () => void this.finalizeRecording();

    recorder.start();
    this.recStartCtxTime = ctx.currentTime;

    const prep = 0.15;
    const firstClick = this.recStartCtxTime + prep;
    this.downbeatTime = this.metro.scheduleCountIn(firstClick, countInBars);
    this.metro.start(this.downbeatTime);
    this.leadOffset = this.downbeatTime - this.recStartCtxTime;

    this.startRecTick();
    this.emit("record-start");
    return { downbeatTime: this.downbeatTime };
  }

  stopRecording() {
    this.metro.stop();
    this.stopRecTick();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }

  private async finalizeRecording() {
    this.metro.stop();
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());

    const blob = new Blob(this.recordChunks, { type: this.mime });
    this.blob = blob;

    let decoded: AudioBuffer | null = null;
    try {
      const arr = await blob.arrayBuffer();
      decoded = await this.ctx.decodeAudioData(arr);
    } catch (e) {
      console.error("decodeAudioData failed", e);
    }

    if (!decoded) {
      this.emit("record-stop");
      return;
    }

    const sr = decoded.sampleRate;
    const fullDuration = decoded.duration;

    // rogne la tête pour aligner le t=0 sur le temps 1 musical
    this.headTrim = Math.min(
      Math.max(0, this.leadOffset + this.latencyCal),
      fullDuration
    );

    const fullMono = toMono(decoded);
    this.alignedSamples = sliceMono(fullMono, sr, this.headTrim, fullDuration);
    this.alignedSR = sr;
    this.alignedDuration = this.alignedSamples.length / sr;

    this.trimStart = 0;
    this.trimEnd = this.alignedDuration;

    // WAV aligné pour la waveform de trim (wavesurfer)
    const alignedWav = encodeWavMono(this.alignedSamples, sr);
    if (this.audioURL) URL.revokeObjectURL(this.audioURL);
    this.audioURL = URL.createObjectURL(alignedWav);
    if (this.waveform) this.waveform.load(this.audioURL);

    this.emit("record-stop");
    this.emit("ready", {
      duration: this.alignedDuration,
      headTrim: this.headTrim,
    });
    this.emit("trim-change", this.trimStart, this.trimEnd);
  }

  // Réinitialise le trim au clip aligné complet.
  resetHeadTrim() {
    this.setTrim(0, this.alignedDuration);
    this.drawRegion();
  }

  private pickMime(): string {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    }
    return "audio/webm";
  }

  private cleanupRecorder() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.mediaRecorder = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    try {
      this.inputSource?.disconnect();
    } catch {}
    try {
      this.analyser?.disconnect();
    } catch {}
    this.inputSource = null;
    this.analyser = null;
    this.dest = null;
    this.recordChunks = [];
  }

  // ─────────────────────────────────────────────────────────────
  // REC TICK + LIVE PEAKS
  // ─────────────────────────────────────────────────────────────
  private startRecTick() {
    this.stopRecTick();
    const loop = () => {
      const elapsed = this.ctx.currentTime - this.downbeatTime;

      // capture le niveau d'entrée pour la waveform live (après le temps 1)
      if (elapsed >= 0 && this.analyser) {
        this.analyser.getFloatTimeDomainData(this.meterBuf);
        let peak = 0;
        for (let i = 0; i < this.meterBuf.length; i++) {
          const a = Math.abs(this.meterBuf[i]);
          if (a > peak) peak = a;
        }
        this.livePeaks.push({ t: elapsed, v: peak });
      }

      this.emit("tick", elapsed);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  private stopRecTick() {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  getLivePeaks(): LivePeak[] {
    return this.livePeaks;
  }

  // ─────────────────────────────────────────────────────────────
  // TRIM
  // ─────────────────────────────────────────────────────────────
  setTrim(start: number, end: number) {
    this.trimStart = Math.max(0, start);
    this.trimEnd = Math.max(this.trimStart, end);
    this.emit("trim-change", this.trimStart, this.trimEnd);
  }
  getTrim() {
    return { start: this.trimStart, end: this.trimEnd };
  }
  getHeadTrim() {
    return this.headTrim;
  }
  getAlignedDuration() {
    return this.alignedDuration;
  }

  // ─────────────────────────────────────────────────────────────
  // TRAITEMENT
  // Étage rapide (sync) : trim + gain + normalize + fades -> pour la lane.
  // Étage complet (async) : + EQ 3 bandes + reverb (rendu offline) -> lecture/WAV.
  // ─────────────────────────────────────────────────────────────
  private buildTakeSamples(opts: TakeFx): Float32Array | null {
    if (!this.alignedSamples) return null;
    const sr = this.alignedSR;

    const mono = sliceMono(this.alignedSamples, sr, this.trimStart, this.trimEnd);
    applyGain(mono, opts.gain ?? 1);
    if (opts.normalize) normalize(mono);
    return mono;
  }

  // Version rapide (sans EQ) pour l'affichage de la lane.
  buildTakeBuffer(opts: TakeFx): AudioBuffer | null {
    const mono = this.buildTakeSamples(opts);
    if (!mono) return null;
    hardClip(mono);
    const buffer = this.ctx.createBuffer(1, Math.max(1, mono.length), this.alignedSR);
    buffer.copyToChannel(mono, 0);
    return buffer;
  }

  // Version complète (EQ) pour la lecture et la sauvegarde.
  async buildProcessedTake(opts: TakeFx): Promise<ProcessedTake | null> {
    let mono = this.buildTakeSamples(opts);
    if (!mono) return null;
    const sr = this.alignedSR;

    mono = await renderEq(mono, sr, {
      low: opts.eqLow ?? 0,
      mid: opts.eqMid ?? 0,
      high: opts.eqHigh ?? 0,
    });
    hardClip(mono);

    const buffer = this.ctx.createBuffer(1, Math.max(1, mono.length), sr);
    buffer.copyToChannel(mono, 0);

    return { buffer, samples: mono, sampleRate: sr };
  }

  encodeWav(take: ProcessedTake): Blob {
    return encodeWavMono(take.samples, take.sampleRate);
  }

  getBlob() {
    return this.blob;
  }
  hasRecording() {
    return this.alignedSamples !== null;
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────
  private cleanupWaveform() {
    if (this.waveform) {
      try {
        this.waveform.destroy();
      } catch {}
      this.waveform = null;
    }
    this.regions = null;
  }

  destroy() {
    this.metro.stop();
    this.stopRecTick();
    this.cleanupRecorder();
    this.cleanupWaveform();
    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
      this.audioURL = null;
    }
    this.listeners = {
      ready: [],
      "record-start": [],
      "record-stop": [],
      tick: [],
      "trim-change": [],
    };
  }
}
