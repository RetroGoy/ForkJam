// lib/audio/metronome.ts
// ------------------------------------------------------------
// Métronome sample-accurate : les clics sont programmés sur l'horloge
// audio (ctx.currentTime), pas via setInterval. Un petit scheduler
// "lookahead" (pattern A Tale of Two Clocks) programme les clics à
// l'avance -> pas de dérive, pas de saccade.
// ------------------------------------------------------------

export class Metronome {
  private ctx: AudioContext;
  private bpm = 120;
  private beatsPerBar = 4;

  private nextNoteTime = 0; // ctx time du prochain clic
  private beatIndex = 0; // 0 = temps fort
  private timerId: number | null = null;
  private muted = false;

  // lookahead scheduler
  private readonly lookaheadMs = 25;
  private readonly scheduleAheadSec = 0.1;

  constructor(ctx: AudioContext, bpm = 120, beatsPerBar = 4) {
    this.ctx = ctx;
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;
  }

  setBpm(bpm: number) {
    if (bpm > 0) this.bpm = bpm;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private secPerBeat() {
    return 60 / this.bpm;
  }

  // Un clic programmé à `time` (ctx time). Le temps fort est plus aigu.
  private click(time: number, accent: boolean) {
    if (this.muted) return; // timing préservé, son coupé
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = accent ? 1600 : 1000;
    const vol = accent ? 0.9 : 0.55;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  // ── Count-in : programme `bars` mesures de clics à partir de startTime.
  // Renvoie le ctx time du "temps 1" musical (fin du décompte).
  scheduleCountIn(startTime: number, bars: number): number {
    const beats = bars * this.beatsPerBar;
    const spb = this.secPerBeat();
    for (let i = 0; i < beats; i++) {
      this.click(startTime + i * spb, i % this.beatsPerBar === 0);
    }
    return startTime + beats * spb;
  }

  // ── Métronome continu à partir de `startTime` (temps fort aligné dessus).
  start(startTime: number) {
    this.stop();
    this.nextNoteTime = startTime;
    this.beatIndex = 0;
    this.scheduler();
  }

  private scheduler = () => {
    const spb = this.secPerBeat();
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.click(this.nextNoteTime, this.beatIndex % this.beatsPerBar === 0);
      this.nextNoteTime += spb;
      this.beatIndex++;
    }
    this.timerId = window.setTimeout(this.scheduler, this.lookaheadMs);
  };

  stop() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
