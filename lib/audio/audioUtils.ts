import { Node } from "@/lib/supabase/supabase";

export function getBranchFrom(nodes: Node[], startNodeId: string): Node[] {
  const branch: Node[] = [];
  let current = nodes.find((n) => n.id === startNodeId);

  while (current) {
    branch.unshift(current);
    current = current.parent_node_id
      ? nodes.find((n) => n.id === current!.parent_node_id)
      : undefined;
  }

  return branch;
}