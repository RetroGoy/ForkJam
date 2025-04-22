import { Node } from '@/lib/supabase';

export function getBranchFrom(nodes: Node[], startNodeId: string): Node[] {
    const branch: Node[] = [];
    let current = nodes.find(n => n.id === startNodeId);
  
    while (current) {
      branch.push(current);
      current = nodes.find(n => n.parent_node_id === current!.id);
    }
  
    return branch;
  }
  