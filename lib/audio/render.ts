// lib/audio/render.ts
// ------------------------------------------------------------
// Égaliseur 3 bandes rendu hors-ligne (OfflineAudioContext).
// low/mid/high en dB. Rien à rendre si tout est neutre.
// ------------------------------------------------------------

export type EqOpts = {
  low: number; // dB
  mid: number; // dB
  high: number; // dB
};

export async function renderEq(
  samples: Float32Array,
  sampleRate: number,
  opts: EqOpts
): Promise<Float32Array> {
  if (opts.low === 0 && opts.mid === 0 && opts.high === 0) return samples;

  const Ctor =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  const octx = new Ctor(1, Math.max(1, samples.length), sampleRate);

  const buf = octx.createBuffer(1, samples.length, sampleRate);
  buf.copyToChannel(samples, 0);
  const src = octx.createBufferSource();
  src.buffer = buf;

  const low = octx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 250;
  low.gain.value = opts.low;

  const mid = octx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1200;
  mid.Q.value = 0.8;
  mid.gain.value = opts.mid;

  const high = octx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 4000;
  high.gain.value = opts.high;

  src.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(octx.destination);

  src.start(0);
  const rendered = await octx.startRendering();
  return rendered.getChannelData(0).slice();
}
