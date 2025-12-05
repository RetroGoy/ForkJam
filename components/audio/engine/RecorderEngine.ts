// components/audio/engine/RecorderEngine.ts
// ------------------------------------------------------------
// PURE ENGINE – no React, no JSX.
// Handles recording, playback, trimming, metronome, timeline syncing.
// UI must call attachWaveform(container) to render the waveform.
// ------------------------------------------------------------

import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

export type RecorderEvent =
  | "ready"        // duration known
  | "record-start"
  | "record-stop"
  | "play"
  | "stop"
  | "tick"         // currentTime: number
  | "trim-change"; // (start, end)

type Listener = (...args: any[]) => void;

export class RecorderEngine {
  // --------- recording -----------
  private mediaRecorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  private recordingStartTime = 0;

  // --------- audio data ----------
  private blob: Blob | null = null;
  private audioURL: string | null = null;

  // --------- waveform ------------
  private waveformContainer: HTMLElement | null = null;
  private waveform: WaveSurfer | null = null;
  private regions: any = null;

  // --------- playback ------------
  private audioEl: HTMLAudioElement | null = null;

  // --------- state ---------------
  private duration = 0;
  private trimStart = 0;
  private trimEnd = 0;

  private raf: number | null = null;

  // --------- metronome -----------
  private metroCtx: AudioContext | null = null;
  private metroIntervalId: number | null = null;
  private metroBpm = 120;

  // --------- events --------------
  private listeners: Record<RecorderEvent, Listener[]> = {
    ready: [],
    "record-start": [],
    "record-stop": [],
    play: [],
    stop: [],
    tick: [],
    "trim-change": [],
  };

  on(event: RecorderEvent, cb: Listener) {
    this.listeners[event].push(cb);
  }

  private emit(event: RecorderEvent, ...args: any[]) {
    for (const cb of this.listeners[event]) cb(...args);
  }

  // ─────────────────────────────────────────────────────────────
  // WAVEFORM
  // ─────────────────────────────────────────────────────────────

  attachWaveform(container: HTMLElement) {
    this.cleanupWaveform();
    this.waveformContainer = container;

    this.waveform = WaveSurfer.create({
      container: this.waveformContainer,
      waveColor: "#fbbf24",
      progressColor: "#ffffff",
      barWidth: 2,
      height: 64,
    });

    const plugin = (RegionsPlugin as any).create({
      dragSelection: true,
    });
    this.regions = this.waveform.registerPlugin(plugin);

    this.waveform.on("ready", () => {
      this.duration = this.waveform!.getDuration();
      this.trimStart = 0;
      this.trimEnd = this.duration;

      const region = this.regions.addRegion({
        start: 0,
        end: this.duration,
        color: "rgba(255, 200, 0, 0.25)",
        drag: true,
        resize: true,
      });

      region.on("update-end", (r: any) => {
        this.setTrim(r.start, r.end);
      });

      this.emit("ready", this.duration);
    });

    if (this.audioURL) {
      this.waveform.load(this.audioURL);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LIFE CYCLE
  // ─────────────────────────────────────────────────────────────

  destroy() {
    this.stopPlayback();
    this.cleanupRecorder();
    this.cleanupWaveform();
    this.stopMetronome();

    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
      this.audioURL = null;
    }

    this.listeners = {
      ready: [],
      "record-start": [],
      "record-stop": [],
      play: [],
      stop: [],
      tick: [],
      "trim-change": [],
    };

    if (this.metroCtx) {
      this.metroCtx.close();
      this.metroCtx = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RECORDING
  // ─────────────────────────────────────────────────────────────

  async startRecording(bpm?: number, deviceId?: string) {
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    this.cleanupRecorder();
    this.stopPlayback(); // on arrête une éventuelle lecture précédente

    this.recordChunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 128000,
    });
    this.mediaRecorder = recorder;
    this.recordingStartTime = performance.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(this.recordChunks, { type: "audio/webm" });
      this.setBlob(blob);
      this.emit("record-stop");
      stream.getTracks().forEach((t) => t.stop());
      this.stopMetronome();
    };

    // métronome
    if (bpm && bpm > 0) {
      this.startMetronome(bpm);
    } else {
      this.startMetronome(120);
    }

    recorder.start();
    this.emit("record-start");
  }

  stopRecording() {
    if (!this.mediaRecorder) return;
    if (this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    this.mediaRecorder = null;
    this.stopMetronome();
  }

  private cleanupRecorder() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    this.mediaRecorder = null;
    this.recordChunks = [];
  }

  // ─────────────────────────────────────────────────────────────
  // METRONOME
  // ─────────────────────────────────────────────────────────────

  private startMetronome(bpm: number) {
    this.stopMetronome();

    this.metroBpm = bpm;
    if (!this.metroCtx) {
      this.metroCtx = new AudioContext();
    }

    const intervalMs = (60 / this.metroBpm) * 1000;

    this.metroIntervalId = window.setInterval(() => {
      if (!this.metroCtx) return;

      const t0 = this.metroCtx.currentTime;
      const osc = this.metroCtx.createOscillator();
      const gain = this.metroCtx.createGain();

      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.9, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);

      osc.connect(gain).connect(this.metroCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.1);
    }, intervalMs);
  }

  private stopMetronome() {
    if (this.metroIntervalId !== null) {
      clearInterval(this.metroIntervalId);
      this.metroIntervalId = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BLOB / URL
  // ─────────────────────────────────────────────────────────────

  private setBlob(blob: Blob) {
    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
    }

    this.blob = blob;
    this.audioURL = URL.createObjectURL(blob);

    // reset trim dans un premier temps, waveform recalculera duration
    this.duration = 0;
    this.trimStart = 0;
    this.trimEnd = 0;

    if (this.waveform) {
      this.waveform.load(this.audioURL);
    }
    this.ensureAudioElement();
  }

  private ensureAudioElement() {
    if (!this.audioURL) return;
    if (!this.audioEl) {
      this.audioEl = new Audio(this.audioURL);
      this.audioEl.loop = false;
    } else {
      this.audioEl.src = this.audioURL;
    }
  }

  getBlob(): Blob | null {
    return this.blob;
  }

  getDuration(): number {
    return this.duration;
  }

  getTrim() {
    return { start: this.trimStart, end: this.trimEnd };
  }

  // ─────────────────────────────────────────────────────────────
  // TRIM
  // ─────────────────────────────────────────────────────────────

  setTrim(start: number, end: number) {
    this.trimStart = Math.max(0, start);
    this.trimEnd = Math.max(this.trimStart, end);
    this.emit("trim-change", this.trimStart, this.trimEnd);
  }

  // ─────────────────────────────────────────────────────────────
  // PLAYBACK
  // ─────────────────────────────────────────────────────────────

  play() {
    if (!this.audioURL) return;
    this.ensureAudioElement();
    if (!this.audioEl) return;

    this.stopPlayback(); // reset tick loop
    this.audioEl.currentTime = this.trimStart;
    this.audioEl.play().catch(() => {});
    this.emit("play");
    this.startTickLoop();
  }

  stop() {
    this.stopPlayback();
    this.emit("stop");
  }

  private stopPlayback() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.stopTickLoop();
  }

  private cleanupAudioGraph() {
    // plus d’AudioContext ici, juste l’élément audio
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }
    this.stopTickLoop();
  }

  private cleanupWaveform() {
    if (this.waveform) {
      this.waveform.destroy();
      this.waveform = null;
    }
    this.regions = null;
    this.waveformContainer = null;
  }

  // ─────────────────────────────────────────────────────────────
  // TICK LOOP
  // ─────────────────────────────────────────────────────────────

  private startTickLoop() {
    this.stopTickLoop();

    const tick = () => {
      if (!this.audioEl) return;
      const t = this.audioEl.currentTime;
      this.emit("tick", t);

      if (this.audioEl.ended || t >= this.trimEnd) {
        this.emit("stop");
        this.stopTickLoop();
        return;
      }

      this.raf = requestAnimationFrame(tick);
    };

    this.raf = requestAnimationFrame(tick);
  }

  private stopTickLoop() {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }
}