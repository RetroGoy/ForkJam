// lib/audio/process.ts
// ------------------------------------------------------------
// Traitement du son enregistré (essentiel) : trim, gain, normalize.
// Tout se fait sur les échantillons décodés (Float32Array),
// sans OfflineAudioContext : rapide et déterministe.
// ------------------------------------------------------------

// Downmix mono d'un AudioBuffer -> Float32Array [-1..1]
export function toMono(buffer: AudioBuffer): Float32Array {
  const chs = buffer.numberOfChannels;
  const len = buffer.length;
  if (chs === 1) {
    // copie défensive
    return buffer.getChannelData(0).slice();
  }
  const out = new Float32Array(len);
  for (let c = 0; c < chs; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  for (let i = 0; i < len; i++) out[i] /= chs;
  return out;
}

// Découpe [startSec, endSec] (clampé) sur des samples mono.
export function sliceMono(
  samples: Float32Array,
  sampleRate: number,
  startSec: number,
  endSec: number
): Float32Array {
  const total = samples.length;
  let s = Math.floor(Math.max(0, startSec) * sampleRate);
  let e = Math.floor(Math.max(0, endSec) * sampleRate);
  s = Math.min(s, total);
  e = Math.min(Math.max(e, s), total);
  return samples.slice(s, e);
}

// Gain linéaire (1 = neutre). Applique en place.
export function applyGain(samples: Float32Array, gain: number): void {
  if (gain === 1) return;
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
}

// Pic absolu du signal.
export function peakOf(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  return peak;
}

// Normalise pour que le pic atteigne targetPeak (par défaut ~ -0.5 dBFS).
// Renvoie le gain appliqué. Ne fait rien si le signal est ~ silencieux.
export function normalize(samples: Float32Array, targetPeak = 0.94): number {
  const peak = peakOf(samples);
  if (peak < 1e-4) return 1;
  const g = targetPeak / peak;
  applyGain(samples, g);
  return g;
}

// Fondu d'entrée / sortie (linéaire), en secondes.
export function applyFades(
  samples: Float32Array,
  sampleRate: number,
  fadeInSec: number,
  fadeOutSec: number
): void {
  const n = samples.length;
  const inN = Math.min(n, Math.floor((fadeInSec || 0) * sampleRate));
  for (let i = 0; i < inN; i++) samples[i] *= i / inN;

  const outN = Math.min(n, Math.floor((fadeOutSec || 0) * sampleRate));
  for (let i = 0; i < outN; i++) samples[n - 1 - i] *= i / outN;
}

// Sécurité anti-clip : borne dur à [-1, 1].
export function hardClip(samples: Float32Array): void {
  for (let i = 0; i < samples.length; i++) {
    if (samples[i] > 1) samples[i] = 1;
    else if (samples[i] < -1) samples[i] = -1;
  }
}
