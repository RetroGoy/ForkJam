export function getWaveColorForInstrument(instr?: string | null): string {
  const val = (instr ?? "").toLowerCase();
  if (!val) return "#a855f7"; // purple-500 (défaut)

  if (val.includes("piano") || val.includes("synth") || val.includes("pad"))
    return "#22c55e"; // green-500
  if (val.includes("guitar") || val.includes("bass")) return "#ef4444"; // red-500
  if (val.includes("drum") || val.includes("perc")) return "#3b82f6"; // blue-500
  if (
    val.includes("sax") ||
    val.includes("trumpet") ||
    val.includes("brass") ||
    val.includes("flute")
  )
    return "#f97316"; // orange-500
  if (val.includes("vocal") || val.includes("voice")) return "#ec4899"; // pink-500
  if (val.includes("string")) return "#14b8a6"; // teal-500
  if (val.includes("fx")) return "#eab308"; // yellow-500

  return "#a855f7"; // fallback purple
}
