// /components/audio/engine/AudioEngine.ts
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

  private playing = false;
  private startTime = 0;
  private pauseTime = 0;
  private duration = 0;

  private subscribers = new Set<(t: number, d: number) => void>();
  private ticking = false;

  constructor() {
    this.ctx = new AudioContext();
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

    this.pauseTime = 0;
  }

  private async loadBuffer(url: string): Promise<AudioBuffer> {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.ctx.decodeAudioData(arr);
  }

  play() {
    if (this.playing) return;

    if (this.getCurrentTime() >= this.duration) this.stop();

    const offset = this.pauseTime || 0;
    this.startTime = this.ctx.currentTime - offset;
    this.playing = true;
    this.sources.clear();

    this.tracks.forEach(track => {
      const src = this.ctx.createBufferSource();
      src.buffer = track.buffer;
      src.connect(track.gainNode);

      src.start(0, offset);
      this.sources.set(track.id, src);

      src.stop(this.ctx.currentTime + (track.duration - offset));
    });

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
    this.sources.forEach(src => {
      try { src.stop(); } catch {}
    });
    this.sources.clear();
  }

  seek(ratio: number) {
    const t = ratio * this.duration;
    this.pauseTime = t;

    if (this.playing) {
      this.stopSources();
      this.play();
    }
  }

  setGain(trackId: string, v: number) {
    const t = this.tracks.get(trackId);
    if (t) t.gainNode.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  getCurrentTime() {
    return this.playing
      ? this.ctx.currentTime - this.startTime
      : this.pauseTime;
  }

  getDuration() {
    return this.duration;
  }
  getTrack(id: string) {
    return this.tracks.get(id) ?? null;
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
  this.subscribers.forEach(fn => fn(d, d));

  this.ticking = false;
  return;
}

    this.subscribers.forEach(fn => fn(t, d));
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}
}