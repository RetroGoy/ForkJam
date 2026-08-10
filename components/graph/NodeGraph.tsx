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
import { computeNodeBase } from "@/components/nodes/NodeBase";
import "reactflow/dist/style.css";
import { ChildNodeCard } from "@/components/nodes/ChildNodeCard";
import type { Node } from "@/lib/supabase/supabase";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";

// ───────────────────────────────────────────
// Layout constants
// ───────────────────────────────────────────
const NODE_W = 300; // largeur uniforme des cartes
const NODE_H = 132; // hauteur de référence (centrage vertical)
const PLUS_SIZE = 40;
const H_SPACING = NODE_W + 96; // pas horizontal entre générations
const V_GAP = 44; // espace vertical entre lignes
const EDGE_RADIUS = 18; // arrondi des coins d'edge (smoothstep)

const EDGE_STYLE: React.CSSProperties = {
  stroke: "#facc15",
  strokeWidth: 3,
};

function NodeUI({ data }: any) {
  return (
    <div className="relative nodrag nopan w-[300px]">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <ChildNodeCard
        node={data.node}
        score={data.score}
        colorClass={data.colorClass}
        isPlaying={data.isPlaying}
        userVote={data.userVote}
        onPlayPause={data.onPlayPause}
        onUpvote={data.onUpvote}
        onDownvote={data.onDownvote}
      />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function PlusUI({ data }: any) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <button
        onClick={data.onAdd}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-lg font-bold text-black shadow-lg shadow-yellow-900/30 transition hover:scale-105 hover:bg-yellow-300"
      >
        +
      </button>
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
  scores: Record<string, number>;
  aggregate: number;
  userVotes: Record<string, 1 | -1 | 0>;
  onVote: (nodeId: string, value: 1 | -1) => void;
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
  scores,
  aggregate,
  userVotes,
  onVote,
}: NodeGraphProps) {

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

  const buildGraph = useCallback(() => {
    const graphNodes: RFNode[] = [];
    const graphEdges: RFEdge[] = [];

    const placed = new Map<string, { centerY: number; depth: number }>();
    const plusCenters = new Map<string, number>();

    let cursorY = 0;

    // Layout par le centre : chaque node a ses enfants + un "+" comme
    // dernière branche. Un leaf partage sa ligne avec son "+" (à droite),
    // un node parent pose son "+" juste sous ses enfants.
    const layout = (id: string, depth: number): number => {
      const children = byParent.get(id) ?? [];

      if (children.length === 0) {
        const centerY = cursorY + NODE_H / 2;
        cursorY += NODE_H + V_GAP;
        placed.set(id, { centerY, depth });
        plusCenters.set(id, centerY);
        return centerY;
      }

      const childCenters = children.map((c) => layout(c.id, depth + 1));

      const plusCenterY = cursorY + PLUS_SIZE / 2;
      cursorY += PLUS_SIZE + V_GAP;
      plusCenters.set(id, plusCenterY);

      const centerY = (childCenters[0] + plusCenterY) / 2;
      placed.set(id, { centerY, depth });
      return centerY;
    };

    rootNodes.forEach((root) => layout(root.id, 0));

    const edge = (source: string, target: string): RFEdge => ({
      id: `${source}-${target}`,
      source,
      target,
      type: "smoothstep",
      pathOptions: { borderRadius: EDGE_RADIUS },
      style: EDGE_STYLE,
    });

    for (const node of nodes) {
      const p = placed.get(node.id);
      if (!p) continue;

      const { colorClass } = computeNodeBase(node);
      const nodeIsPlaying =
        transportPlaying && branch.some((b) => b.id === node.id);
      const displayScore = node.is_root ? aggregate : scores[node.id] ?? 0;
      const userVote = userVotes[node.id] ?? 0;

      graphNodes.push({
        id: node.id,
        type: "node",
        position: { x: p.depth * H_SPACING, y: p.centerY - NODE_H / 2 },
        draggable: false,
        data: {
          node,
          score: displayScore,
          colorClass,
          isPlaying: nodeIsPlaying,
          isSelected: selectedNodeId === node.id,
          userVote,
          onPlayPause: () => onNodeSelect(node),
          onUpvote: () => onVote(node.id, 1),
          onDownvote: () => onVote(node.id, -1),
        },
      });

      const plusCenterY = plusCenters.get(node.id);
      if (plusCenterY != null) {
        const plusId = `${node.id}-plus`;
        graphNodes.push({
          id: plusId,
          type: "plus",
          position: {
            x: (p.depth + 1) * H_SPACING,
            y: plusCenterY - PLUS_SIZE / 2,
          },
          draggable: false,
          data: { onAdd: () => onAddChild(node) },
        });
        graphEdges.push(edge(node.id, plusId));
      }
    }

    byParent.forEach((children, parentId) => {
      children.forEach((child) => graphEdges.push(edge(parentId, child.id)));
    });

    return { graphNodes, graphEdges };
  }, [
    nodes,
    rootNodes,
    byParent,
    selectedNodeId,
    onAddChild,
    onNodeSelect,
    transportPlaying,
    branch,
    scores,
    aggregate,
    userVotes,
    onVote,
  ]);

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
        defaultEdgeOptions={{ type: "smoothstep", style: EDGE_STYLE }}
      >
        <div className="absolute right-2 bottom-2 z-10">
          <Controls />
        </div>
        <Background gap={12} size={1} color="#444" />
      </ReactFlow>
    </div>
  );
}
