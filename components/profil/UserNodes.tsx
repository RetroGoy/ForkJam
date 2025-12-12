import React from "react";
import { NodeCard } from "@/components/nodes/NodeCard";

export default function UserNodes({ nodes }: any) {
  return (
    <div>
      <h2 className="text-xl text-yellow-400 font-bold mb-4">Your Nodes</h2>
      <div className="space-y-3">
        {nodes.map((node: any) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}