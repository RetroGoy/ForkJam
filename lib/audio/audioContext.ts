// lib/audio/audioContext.ts
// ------------------------------------------------------------
// UNE SEULE AudioContext partagée dans toute l'app.
// C'est la clé de la synchro : lecture des parents ET enregistrement
// tournent sur la même horloge (ctx.currentTime).
// ------------------------------------------------------------

let _ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("getAudioContext() est browser-only");
  }
  if (!_ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    _ctx = new Ctor({ latencyHint: "interactive" });
  }
  return _ctx;
}

// À appeler sur une interaction utilisateur (les navigateurs suspendent
// l'AudioContext tant qu'il n'y a pas eu de geste).
export async function resumeAudioContext(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

// Latence de sortie estimée (casque/HP). Sert à la calibration de synchro.
export function getOutputLatency(ctx: AudioContext): number {
  // outputLatency : Firefox/Chrome récents. baseLatency : fallback.
  const anyCtx = ctx as AudioContext & { outputLatency?: number };
  if (typeof anyCtx.outputLatency === "number" && anyCtx.outputLatency > 0) {
    return anyCtx.outputLatency;
  }
  return ctx.baseLatency || 0;
}
