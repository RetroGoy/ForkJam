export function getNodeColor(instrument: string) {
  const lower = instrument.toLowerCase();

  if (lower.includes("piano") || lower.includes("synth"))
    return "#16a34a"; // green-600
  if (lower.includes("guitar") || lower.includes("bass"))
    return "#dc2626"; // red-600
  if (lower.includes("drum") || lower.includes("perc"))
    return "#2563eb"; // blue-600
  
  return "#7c3aed"; // purple-600
}