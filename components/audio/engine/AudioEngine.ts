// /components/audio/engine/AudioEngine.ts
// ------------------------------------------------------------
// Lecture multipiste sur l'AudioContext PARTAGÉE.
// Toutes les pistes (parents d'une branche + éventuel overdub local
// en cours d'enregistrement) partent au même instant logique 0 sur la
// même horloge -> synchro garantie.
//
// L'alignement (latence d'enregistrement) est gravé dans les fichiers
// au moment du save, donc plus aucune compensation ici.
// ------------------------------------------------------------

import { getAudioContext } from "@/lib/audio/audioContext";

export type EngineTrack = {
  id: string;
  url: string;
  buffer: AudioBuffer;
  duration: number;
  gainNode: GainNode;
};

export class AudioEngine {
  private ctx: AudioContext;
  private tracks: Map<string, EngineTrack> = new Map();
  private sources: Map<string, AudioBufferSourceNode> = new Map();

  // Overdub = la prise locale en cours (pas encore sauvegardée),
  // jouée en même temps que les parents pour la preview.
  private overdubBuffer: AudioBuffer | null = null;
  private overdubGainNode: GainNode | null = null;
  private overdubSource: AudioBufferSourceNode | null = null;

  private playing = false;
  private startTime = 0; // ctx time correspondant à l'instant logique 0
  private pauseTime = 0; // position logique en pause
  private duration = 0;

  private subscribers = new Set<(t: number, d: number) => void>();
  private ticking = false;

  constructor() {
    this.ctx = getAudioContext();
  }

  getContext() {
    return this.ctx;
  }

  async loadBranch(branch: { id: string; audio_url: string | null }[]) {
    this.stop();

    this.tracks.clear();
    this.sources.clear();
    this.duration = 0;

    for (const n of branch) {
      if (!n.audio_url) continue;

      const buffer = await this.loadBuffer(n.audio_url);
      const gainNode = this.ctx.createGain();
      gainNode.connect(this.ctx.destination);

      this.tracks.set(n.id, {
        id: n.id,
        url: n.audio_url,
        buffer,
        duration: buffer.duration,
        gainNode,
      });

      this.duration = Math.max(this.duration, buffer.duration);
    }

    this.recomputeDuration();
    this.pauseTime = 0;
  }

  private async loadBuffer(url: string): Promise<AudioBuffer> {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.ctx.decodeAudioData(arr);
  }

  // ── Overdub local (buffer déjà décodé & aligné sur t=0). ──
  setOverdub(buffer: AudioBuffer | null, gain = 1) {
    // stoppe une éventuelle source overdub en cours
    if (this.overdubSource) {
      try {
        this.overdubSource.stop();
      } catch {}
      this.overdubSource = null;
    }

    this.overdubBuffer = buffer;

    if (buffer) {
      if (!this.overdubGainNode) {
        this.overdubGainNode = this.ctx.createGain();
        this.overdubGainNode.connect(this.ctx.destination);
      }
      this.overdubGainNode.gain.value = gain;
    }

    this.recomputeDuration();
  }

  setOverdubGain(v: number) {
    if (this.overdubGainNode) {
      this.overdubGainNode.gain.setValueAtTime(v, this.ctx.currentTime);
    }
  }

  private recomputeDuration() {
    let d = 0;
    this.tracks.forEach((t) => (d = Math.max(d, t.duration)));
    if (this.overdubBuffer) d = Math.max(d, this.overdubBuffer.duration);
    this.duration = d;
  }

  // Démarre maintenant.
  play() {
    this.playAt(this.ctx.currentTime + 0.05);
  }

  // Démarre à un instant ctx précis (utilisé pour caler les parents sur
  // le "temps 1" pendant l'enregistrement).
  playAt(ctxStartTime: number, logicalOffset = this.pauseTime || 0) {
    if (this.playing) return;
    if (logicalOffset >= this.duration) logicalOffset = 0;

    const startAt = Math.max(ctxStartTime, this.ctx.currentTime);

    this.startTime = startAt - logicalOffset;
    this.playing = true;
    this.sources.clear();

    this.tracks.forEach((track) => {
      const remaining = Math.max(0, track.duration - logicalOffset);
      if (remaining <= 0) return;

      const src = this.ctx.createBufferSource();
      src.buffer = track.buffer;
      src.connect(track.gainNode);
      src.start(startAt, logicalOffset);
      src.stop(startAt + remaining);
      this.sources.set(track.id, src);
    });

    if (this.overdubBuffer && this.overdubGainNode) {
      const remaining = Math.max(0, this.overdubBuffer.duration - logicalOffset);
      if (remaining > 0) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.overdubBuffer;
        src.connect(this.overdubGainNode);
        src.start(startAt, logicalOffset);
        src.stop(startAt + remaining);
        this.overdubSource = src;
      }
    }

    this.startTick();
  }

  pause() {
    if (!this.playing) return;
    this.pauseTime = this.getCurrentTime();
    this.stopSources();
    this.playing = false;
  }

  stop() {
    this.stopSources();
    this.pauseTime = 0;
    this.playing = false;
  }

  private stopSources() {
    this.sources.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    this.sources.clear();

    if (this.overdubSource) {
      try {
        this.overdubSource.stop();
      } catch {}
      this.overdubSource = null;
    }
  }

  seek(ratio: number) {
    const t = ratio * this.duration;
    this.pauseTime = t;

    if (this.playing) {
      this.stopSources();
      this.playing = false;
      this.playAt(this.ctx.currentTime + 0.03, t);
    }
  }

  setGain(trackId: string, v: number) {
    const t = this.tracks.get(trackId);
    if (t) t.gainNode.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  getCurrentTime() {
    return this.playing ? this.ctx.currentTime - this.startTime : this.pauseTime;
  }

  getDuration() {
    return this.duration;
  }

  getTrack(id: string) {
    return this.tracks.get(id) ?? null;
  }

  isPlaying() {
    return this.playing;
  }

  // ---------- Tick Loop ----------
  subscribe(fn: (t: number, d: number) => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private startTick() {
    if (this.ticking) return;
    this.ticking = true;

    const loop = () => {
      if (!this.playing) {
        this.ticking = false;
        return;
      }

      const t = this.getCurrentTime();
      const d = this.duration;

      if (t >= d) {
        this.stop();
        this.subscribers.forEach((fn) => fn(d, d));
        this.ticking = false;
        return;
      }

      this.subscribers.forEach((fn) => fn(t, d));
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
