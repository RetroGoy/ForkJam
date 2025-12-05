"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  Node as RFNode,
  Edge as RFEdge,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";
import { NodeCard } from "./NodeCard";
import type { Node } from "@/lib/supabase/supabase";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

// ───────────────────────────────────────────
// Layout constants
// ───────────────────────────────────────────
const H_SPACING = 320; // horizontal gap between generations
const V_SPACING = 220; // vertical gap between leaves
const PLUS_OFFSET_Y = 60; // distance from last child center to "+"

const EDGE_STYLE: React.CSSProperties = {
  stroke: "#FFD84A",
  strokeWidth: 3,
};

function NodeUI({ data }: any) {
  return (
    <div className="relative nodrag nopan">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <NodeCard
        node={data.node}
        score={data.score}
        isPlaying={data.isPlaying}
        isSelected={data.isSelected}
        onPlayPause={data.onPlayPause}
        onUpvote={data.onUpvote}
        onDownvote={data.onDownvote}
        isRoot={data.node.parent_node_id === null}
        onAddChild={data.onAddChild}
      />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function PlusUI({ data }: any) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div
        onClick={data.onAdd}
        className="flex items-center justify-center w-10 h-10 bg-yellow-600 text-black rounded-sm cursor-pointer hover:bg-yellow-500 transition"
      >
        +
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

// ───────────────────────────────────────────
// Props
// ───────────────────────────────────────────

interface NodeGraphProps {
  nodes: Node[];
  topic: Node;
  user: { id: string } | null;
  refreshNodes: () => Promise<void>;
  onNodeSelect: (node: Node) => void;
  onAddChild: (node: Node) => void;
  selectedNodeId?: string | null;
}

// ───────────────────────────────────────────
// Main component
// ───────────────────────────────────────────

export function NodeGraph({
  nodes,
  topic,
  user,
  refreshNodes,
  onNodeSelect,
  onAddChild,
  selectedNodeId = null,
}: NodeGraphProps) {
  // on lit juste l’état de lecture global pour l’icône Play/Pause
const { branch, isPlaying: transportPlaying } = useAudioEngine();
  const reactFlow = useReactFlow();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode[]>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);

  const rootNodes = useMemo(
    () => nodes.filter((n: Node) => n.parent_node_id === null),
    [nodes]
  );

  const byParent = useMemo(() => {
    const map = new Map<string, Node[]>();
    nodes.forEach((n: Node) => {
      if (!n.parent_node_id) return;
      if (!map.has(n.parent_node_id)) map.set(n.parent_node_id, []);
      map.get(n.parent_node_id)!.push(n);
    });
    return map;
  }, [nodes]);

  type LayoutInfo = {
    y: number;
    childrenY: number[];
  };

  const buildGraph = useCallback(() => {
    const graphNodes: RFNode[] = [];
    const graphEdges: RFEdge[] = [];

    const layoutInfos = new Map<string, LayoutInfo>();
    let nextLeafIndex = 0;

    const layoutSubtree = (id: string, depth: number): number => {
      const children = byParent.get(id) ?? [];

      if (children.length === 0) {
        const y = nextLeafIndex * V_SPACING;
        nextLeafIndex += 1;
        layoutInfos.set(id, { y, childrenY: [] });
        return y;
      }

      const childYs: number[] = [];
      children.forEach((child: Node) => {
        const cy = layoutSubtree(child.id, depth + 1);
        childYs.push(cy);
      });

      const first = childYs[0];
      const last = childYs[childYs.length - 1];
      const y = (first + last) / 2;

      layoutInfos.set(id, { y, childrenY: childYs });
      return y;
    };

    rootNodes.forEach((root: Node) => {
      layoutSubtree(root.id, 0);
    });

    nodes.forEach((node: Node) => {
      const info = layoutInfos.get(node.id);
      if (!info) return;

      let depth = 0;
      let current: Node | undefined = node;
      while (current && current.parent_node_id) {
        depth++;
        current = nodes.find((n: Node) => n.id === current!.parent_node_id);
      }

      const posX = depth * H_SPACING;
      const posY = info.y;

        const nodeInBranch = branch.some((b) => b.id === node.id);
        const nodeIsPlaying = transportPlaying && nodeInBranch;

        graphNodes.push({
          id: node.id,
          type: "node",
          position: { x: posX, y: posY },
          draggable: false,
          data: {
            node,
            score: node.note ?? 0,
            isPlaying: nodeIsPlaying,
            isSelected: selectedNodeId === node.id,
            onPlayPause: () => onNodeSelect(node),
            onUpvote: () => {},
            onDownvote: () => {},
            onAddChild: () => onAddChild(node),
          },
        });
    });

    byParent.forEach((children, parentId) => {
      children.forEach((child: Node) => {
        graphEdges.push({
          id: `${parentId}-${child.id}`,
          source: parentId,
          target: child.id,
          type: "step",
          style: EDGE_STYLE,
        });
      });
    });

    nodes.forEach((node: Node) => {
      const info = layoutInfos.get(node.id);
      if (!info) return;

      const children = byParent.get(node.id) ?? [];

      let plusY: number;
      if (children.length === 0) {
        plusY = info.y + PLUS_OFFSET_Y;
      } else {
        const lastChild = children[children.length - 1];
        const lastChildInfo = layoutInfos.get(lastChild.id);
        const lastChildY = lastChildInfo ? lastChildInfo.y : info.y;
        plusY = lastChildY + PLUS_OFFSET_Y;
      }

      let depth = 0;
      let current: Node | undefined = node;
      while (current && current.parent_node_id) {
        depth++;
        current = nodes.find((n: Node) => n.id === current!.parent_node_id);
      }

      const plusX = (depth + 1) * H_SPACING;
      const plusId = `${node.id}-plus`;

      graphNodes.push({
        id: plusId,
        type: "plus",
        position: { x: plusX, y: plusY },
        draggable: false,
        data: { onAdd: () => onAddChild(node) },
      });

      graphEdges.push({
        id: `${node.id}-${plusId}`,
        source: node.id,
        target: plusId,
        type: "step",
        style: EDGE_STYLE,
      });
    });

    return { graphNodes, graphEdges };
  }, [nodes, rootNodes, byParent, selectedNodeId, onAddChild, onNodeSelect, transportPlaying]);

  useEffect(() => {
    const { graphNodes, graphEdges } = buildGraph();
    setRfNodes(graphNodes);
    setRfEdges(graphEdges);
  }, [buildGraph, setRfNodes, setRfEdges]);

  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        reactFlow.fitView({ padding: 0.2 });
      } catch {
        // ignore
      }
    });
  }, [reactFlow]);

  const nodeTypes = useMemo(
    () => ({
      node: NodeUI,
      plus: PlusUI,
    }),
    []
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        panOnDrag
        zoomOnScroll
        defaultEdgeOptions={{ type: "step", style: EDGE_STYLE }}
      >
        <div className="absolute right-2 bottom-2 z-10">
          <Controls />
        </div>
        <Background gap={12} size={1} color="#444" />
      </ReactFlow>
    </div>
  );
}