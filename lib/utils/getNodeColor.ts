export function getNodeColor(instr: string | null) {
  const val = instr?.toLowerCase() ?? "";
  if (!val) return "bg-purple-600 border-purple-500 text-purple-100";

  if (val.includes("piano") || val.includes("synth"))
    return "bg-green-600 border-green-500 text-green-100";

  if (val.includes("guitar") || val.includes("bass"))
    return "bg-red-600 border-red-500 text-red-100";

  if (val.includes("drum") || val.includes("percussion"))
    return "bg-blue-600 border-blue-500 text-blue-100";

  return "bg-purple-600 border-purple-500 text-purple-100";
}