import type { Node } from "@/lib/supabase/supabase";
import { getColorClass } from "@/lib/utils/getColorClass";

export function computeNodeBase(node: Node, votes?: Record<string, number>) {
  const score = (node.note ?? 0) + (votes?.[node.id] ?? 0);

  const colorClass = getColorClass(node.tag ?? "");

  function formatTimeAgo(dateString?: string) {
    if (!dateString) return "";
    const created = new Date(dateString).getTime();
    const diffMs = Date.now() - created;

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    const m = Math.floor(d / 30);
    const y = Math.floor(d / 365);

    if (y > 0) return `${y} year${y > 1 ? "s" : ""} ago`;
    if (m > 0) return `${m} month${m > 1 ? "s" : ""} ago`;
    if (d > 0) return `${d} day${d > 1 ? "s" : ""} ago`;
    if (h > 0) return `${h} hour${h > 1 ? "s" : ""} ago`;
    if (min > 0) return `${min} minute${min > 1 ? "s" : ""} ago`;
    return "Just now";
  }

  return {
    score,
    colorClass,
    timeAgo: formatTimeAgo(node.created_at),
  };
}