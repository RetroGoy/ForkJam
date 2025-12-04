export function getColorClass(tag?: string) {
  const t = (tag ?? "").toLowerCase();

  if (t.includes("electro")) return "bg-red-700";
  if (t.includes("jazz")) return "bg-blue-700";
  if (t.includes("rock")) return "bg-green-700";
  return "bg-gray-700";
}