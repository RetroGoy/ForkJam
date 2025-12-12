export function getColorClass(tag?: string) {
  const t = (tag ?? "").toLowerCase();
console.log("TAG RECUS =", t);
  if (t.includes("jazz")) return "bg-red-700";
  if (t.includes("blues")) return "bg-orange-700";
  if (t.includes("rock")) return "bg-amber-700";
  if (t.includes("metal")) return "bg-yellow-700";
  if (t.includes("indie") || t.includes("alternative")) return "bg-lime-700";
  if (t.includes("pop")) return "bg-green-700";
  if (t.includes("dance") || t.includes("edm")) return "bg-emerald-700";
  if (t.includes("house")) return "bg-teal-700";
  if (t.includes("techno")) return "bg-cyan-700";
  if (t.includes("ambiant") || t.includes("ambient")) return "bg-sky-700";
  if (t.includes("experimental")) return "bg-blue-700";
  if (t.includes("classical") || t.includes("orchestral")) return "bg-indigo-700";
  if (t.includes("world") || t.includes("folk")) return "bg-violet-700";
  if (t.includes("soundtrack")) return "bg-purple-700";
  if (t.includes("reggae") || t.includes("dub")) return "bg-fuchsia-700";
  if (t.includes("hiphop") || t.includes("hip-hop")) return "bg-pink-700";

  return "bg-gray-700";
}