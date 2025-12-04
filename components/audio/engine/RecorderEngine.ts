// components/recorder/RecorderEngine.ts
// ------------------------------------------------------------
// PURE ENGINE – no React, no JSX.
// Handles recording, playback, FX, trimming, metronome, timeline syncing.
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

  // --------- audio graph ---------
  private audioContext: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;

  // --------- state ---------------
  private duration = 0;
  private trimStart = 0;
  private trimEnd = 0;

  private fxDistortion = false;
  private fxLowpass = false;
  private fxGain = 1;

  private raf: number | null = null;

  // --------- events --------------
  private listeners: Record<RecorderEvent, Listener[]> = {
    "ready": [],
    "record-start": [],
    "record-stop": [],
    "play": [],
    "stop": [],
    "tick": [],
    "trim-change": [],
  };

  on(event: RecorderEvent, cb: Listener) {
    this.listeners[event].push(cb);
  }

  private emit(event: RecorderEvent, ...args: any[]) {
    for (const cb of this.listeners[event]) cb(...args);
  }

  // ─────────────────────────────────────────────────────────────
  // LIFE CYCLE
  // ─────────────────────────────────────────────────────────────

  /**
   * Attach a DOM container where the waveform must be rendered.
   * Call this once you have a <div ref={...}> in React.
   */
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

      // région entière par défaut
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

  destroy() {
    this.stopPlayback();
    this.cleanupRecorder();
    this.cleanupWaveform();
    this.cleanupAudioGraph();

    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
      this.audioURL = null;
    }

    this.listeners = {
      "ready": [],
      "record-start": [],
      "record-stop": [],
      "play": [],
      "stop": [],
      "tick": [],
      "trim-change": [],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // RECORDING
  // ─────────────────────────────────────────────────────────────

async startRecording(deviceId?: string) {
  const constraints: MediaStreamConstraints = {
    audio: deviceId ? { deviceId: { exact: deviceId } } : true,
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // on nettoie l’ancien recorder + graph, mais PAS la waveform
  this.cleanupRecorder();
  this.cleanupAudioGraph();
  // ❌ PAS de cleanupWaveform ici

  this.recordChunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: "audio/webm",
    audioBitsPerSecond: 128000,
  });
  this.mediaRecorder = recorder;
  this.recordingStartTime = Date.now();

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) this.recordChunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(this.recordChunks, { type: "audio/webm" });
    this.setBlob(blob);
    this.emit("record-stop");
  };

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
  // BLOB / URL
  // ─────────────────────────────────────────────────────────────

  private setBlob(blob: Blob) {
    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
    }

    this.blob = blob;
    this.audioURL = URL.createObjectURL(blob);

    if (this.waveform) {
      this.waveform.load(this.audioURL);
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
  // PLAYBACK + FX
  // ─────────────────────────────────────────────────────────────

  play() {
    if (!this.audioURL) return;

    this.stopPlayback();
    this.ensureAudioGraph();

    if (!this.audioEl) return;

    this.audioEl.currentTime = this.trimStart;
    this.audioEl.play().catch(() => {});
    this.emit("play");
    this.startTickLoop();
  }

  stop() {
    this.stopPlayback();
    this.emit("stop");
  }

  updateFX(opts: { distortion?: boolean; lowpass?: boolean; gain?: number }) {
    if (opts.distortion !== undefined) this.fxDistortion = opts.distortion;
    if (opts.lowpass !== undefined) this.fxLowpass = opts.lowpass;
    if (opts.gain !== undefined) this.fxGain = opts.gain;
    this.applyFXToGraph();
  }

  private ensureAudioGraph() {
    if (!this.audioURL) return;

    if (!this.audioEl) {
      this.audioEl = new Audio(this.audioURL);
      this.audioEl.loop = false;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (!this.sourceNode) {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioEl);
    }
    if (!this.distortionNode) {
      this.distortionNode = this.audioContext.createWaveShaper();
    }
    if (!this.lowpassNode) {
      this.lowpassNode = this.audioContext.createBiquadFilter();
      this.lowpassNode.type = "lowpass";
    }
    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain();
    }

    this.sourceNode.disconnect();
    this.distortionNode.disconnect();
    this.lowpassNode.disconnect();
    this.gainNode.disconnect();

    this.sourceNode
      .connect(this.distortionNode)
      .connect(this.lowpassNode)
      .connect(this.gainNode)
      .connect(this.audioContext.destination);

    this.applyFXToGraph();
  }

  private applyFXToGraph() {
    if (!this.distortionNode || !this.lowpassNode || !this.gainNode) return;

    // distortion
    if (this.fxDistortion) {
      this.distortionNode.curve = this.makeDistortionCurve(400);
      this.distortionNode.oversample = "4x";
    } else {
      this.distortionNode.curve = null;
    }

    // lowpass
    this.lowpassNode.frequency.value = this.fxLowpass ? 2000 : 20000;

    // gain
    this.gainNode.gain.value = this.fxGain;
  }

  private makeDistortionCurve(amount: number) {
    const k = typeof amount === "number" ? amount : 0;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    let x: number;
    for (let i = 0; i < n; ++i) {
      x = (i * 2) / n - 1;
      curve[i] =
        ((3 + k) * x * 20 * deg) /
        (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private stopPlayback() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.stopTickLoop();
  }

  private cleanupAudioGraph() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.distortionNode) {
      this.distortionNode.disconnect();
      this.distortionNode = null;
    }
    if (this.lowpassNode) {
      this.lowpassNode.disconnect();
      this.lowpassNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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