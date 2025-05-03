"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  Node as RFNode,
  Edge as RFEdge,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { NodeCard } from "./NodeCard";
import { InlineNodeRecorder } from "@/components/ui/inlineNodeRecorder";
import type { Node } from "@/lib/supabase";
import { redirect } from "next/dist/server/api-utils";

// ────────────────────────────────────────────────────────────────────────────
// Layout & style constants
// ────────────────────────────────────────────────────────────────────────────
const H_SPACING = 320; // horizontal gap between generations
const V_SPACING = 220; // vertical gap between siblings
const PLUS_OFFSET_Y = 150; // additional gap before placing the "+" node under last child
const PLUS_OFFSET_X = 150; // additional gap before placing the "+" node under last child
const EDGE_STYLE = { stroke: "#facc15", strokeWidth: 3 } as const; // all edges share this style

// utility to create a styled edge quickly
const addEdge = (edges: RFEdge[], source: string, target: string) => {
  edges.push({ id: `${source}-${target}`, source, target });
};

// ────────────────────────────────────────────────────────────────────────────
// Custom React‑Flow node: MusicNode (real DB record)
// ────────────────────────────────────────────────────────────────────────────
function MusicNode({ data }: any) {
  const { node, allNodes, onAddChild } = data;

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Left} id="t" style={{ opacity: 0, width: 7, height: 7 }} />
      <NodeCard
        node={node}
        allNodes={allNodes}
        onAddChild={() => onAddChild(node)}
      />
      <Handle type="source" position={Position.Right} id="s" style={{ opacity: 0, width: 7, height: 7 }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Custom React‑Flow node: PlusNode (visual only – invokes InlineNodeRecorder)
// ────────────────────────────────────────────────────────────────────────────
function PlusNode({ data }: any) {
  const { parentId, topicId, bpm, userId, refreshNodes } = data;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} id="pt" style={{ opacity: 0, width: 1, height: 1 }} />

        <InlineNodeRecorder
          parentId={parentId}
          topicId={topicId}
          bpm={bpm}
          userId={userId}
          refreshNodes={refreshNodes}
        />

      <Handle type="source" position={Position.Right} id="ps" style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
interface NodeGraphProps {
  nodes: Node[];
  topic: { id: string; bpm: number };
  user: { id: string } | null;
  onNodeSelect: (node: Node) => void;
  onAddChild: (parentNode: Node) => void;
  refreshNodes: () => void;
}

function NodeGraphComponent({ nodes, topic, user, onNodeSelect, onAddChild, refreshNodes }: NodeGraphProps) {
  // internal React‑Flow state helpers
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode[]>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);

  // register custom nodeTypes once
  const nodeTypes = useMemo(() => ({ music: MusicNode, plus: PlusNode }), []);

  // ────────────────────────────── layout algo ──────────────────────────────
  const buildGraph = useCallback(() => {
    if (nodes.length === 0) return { graphNodes: [], graphEdges: [] };

    /** helpers */
    const nodeMap = new Map<string, Node>();
    const childrenMap = new Map<string, string[]>();

    nodes.forEach((n) => {
      nodeMap.set(n.id, n);
      if (n.parent_node_id) {
        if (!childrenMap.has(n.parent_node_id)) childrenMap.set(n.parent_node_id, []);
        childrenMap.get(n.parent_node_id)!.push(n.id);
      }
    });

    const roots = nodes.filter((n) => !n.parent_node_id);
    const graphNodes: RFNode[] = [];
    const graphEdges: RFEdge[] = [];

    /** Recursively layout a subtree */
    const layout = (
      id: string,
      level: number,
      order: number,
      siblingCount: number
    ) => {
      // 1. position current node
      const x = level * H_SPACING;
      const baseY = order * V_SPACING - ((siblingCount - 1) * V_SPACING) / 2;

      graphNodes.push({
        id,
        type: "music",
        position: { x, y: baseY },
        draggable: false,
        data: { node: nodeMap.get(id), allNodes: nodes, onAddChild },
      });

      // 2. fetch children & always append plus node id
      const children = childrenMap.get(id) ?? [];
      const plusId = `${id}-plus`;
      const items = [...children, plusId];

      // 3. place plus node BELOW the last child (or current node when no children)
      const lastIdx = children.length; // index in items array
      const plusY = baseY + (children.length > 0 ? (lastIdx * V_SPACING) : 0) + PLUS_OFFSET_Y;
      graphNodes.push({
        id: plusId,
        type: "plus",
        position: { x: x + H_SPACING, y: plusY },
        draggable: false,
        data: {
          parentId: id,
          topicId: topic.id,
          bpm: topic.bpm,
          userId: user?.id ?? "anonymous",
          refreshNodes,
        },
      });

      // 4. edges from parent → each item (child + plus)
      addEdge(graphEdges, id, plusId);
      children.forEach((childId, idx) => {
        addEdge(graphEdges, id, childId);
        layout(childId, level + 1, idx, children.length);
      });
    };

    // layout all roots (there can be multiple trees for a topic)
    roots.forEach((root, idx) => layout(root.id, 0, idx, roots.length));

    return { graphNodes, graphEdges };
  }, [nodes, topic, user, refreshNodes, onAddChild]);

  // re‑layout whenever db nodes change
  useEffect(() => {
    const { graphNodes, graphEdges } = buildGraph();
    setRfNodes(graphNodes);
    setRfEdges(graphEdges);
  }, [buildGraph, setRfNodes, setRfEdges]);

  // ─────────────────────────────── render ────────────────────────────────
  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, n) => {
            if (n.type === "music") onNodeSelect((n.data as any).node);
          }}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ type: "smoothstep", style: EDGE_STYLE }}
          nodesDraggable={false}
          panOnDrag
          zoomOnScroll
          fitView>
            <div className="absolute right-0 bottom-0 z-10">
              <Controls />
            </div>
          <Controls />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}

export { NodeGraphComponent as NodeGraph };
export default NodeGraphComponent;
