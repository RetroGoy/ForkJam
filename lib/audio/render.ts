// lib/audio/render.ts
// ------------------------------------------------------------
// Post-prod légère rendue hors-ligne (OfflineAudioContext) :
// EQ 3 bandes (low/mid/high, en dB) + reverb (0..1).
// Rien à rendre si tout est neutre -> renvoie les samples tels quels.
// ------------------------------------------------------------

export type EffectOpts = {
  low: number; // dB
  mid: number; // dB
  high: number; // dB
  reverb: number; // 0..1 (quantité)
};

function makeImpulse(
  ctx: BaseAudioContext,
  seconds: number,
  decay: number
): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = impulse.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return impulse;
}

export async function renderEffects(
  samples: Float32Array,
  sampleRate: number,
  opts: EffectOpts
): Promise<Float32Array> {
  const hasEq = opts.low !== 0 || opts.mid !== 0 || opts.high !== 0;
  const hasReverb = opts.reverb > 0;
  if (!hasEq && !hasReverb) return samples;

  const Ctor =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  const reverbSeconds = 1.4;
  const tail = hasReverb ? Math.floor(sampleRate * reverbSeconds) : 0;
  const length = Math.max(1, samples.length + tail);

  const octx = new Ctor(1, length, sampleRate);

  const buf = octx.createBuffer(1, samples.length, sampleRate);
  buf.copyToChannel(samples, 0);
  const src = octx.createBufferSource();
  src.buffer = buf;

  let node: AudioNode = src;

  if (hasEq) {
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

    node.connect(low);
    low.connect(mid);
    mid.connect(high);
    node = high;
  }

  if (hasReverb) {
    const dry = octx.createGain();
    dry.gain.value = 1;
    node.connect(dry);
    dry.connect(octx.destination);

    const conv = octx.createConvolver();
    conv.buffer = makeImpulse(octx, reverbSeconds, 2.5);
    const wet = octx.createGain();
    wet.gain.value = opts.reverb;
    node.connect(conv);
    conv.connect(wet);
    wet.connect(octx.destination);
  } else {
    node.connect(octx.destination);
  }

  src.start(0);
  const rendered = await octx.startRendering();
  return rendered.getChannelData(0).slice();
}
