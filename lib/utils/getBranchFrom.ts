import type { Node } from "@/lib/supabase/supabase";

export function getBranchFrom(nodes: Node[], startId: string) {
  const branch: Node[] = [];
  let cur = nodes.find((n) => n.id === startId);

  while (cur) {
    branch.unshift(cur);
    cur = cur.parent_node_id
      ? nodes.find((n) => n.id === cur!.parent_node_id)
      : undefined;
  }

  return branch.map((n) => ({
    id: n.id,
    audio_url: n.audio_url,
  }));
}