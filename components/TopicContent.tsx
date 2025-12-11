"use client";

import { useState, useEffect } from "react";
import { NodeGraph } from "@/components/graph/NodeGraph";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import { BranchTimelinePlayer } from "@/components/audio/ui/BranchTimelinePlayer";
import type { Node } from "@/lib/supabase/supabase";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";
import { getBranchFrom } from "@/lib/utils/getBranchFrom";

const SIDEBAR_WIDTH = 260;

type BranchNode = {
  id: string;
  audio_url: string | null;
};

export function TopicContent({
  rootNode,
  initialNodes,
}: {
  rootNode: Node;
  initialNodes: Node[];
}) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(false);

  const [recorderOpen, setRecorderOpen] = useState(false);
  const [recorderParentId, setRecorderParentId] = useState<string | null>(null);
  const [recorderBranch, setRecorderBranch] = useState<BranchNode[]>([]);

  const audio = useAudioEngine();

  useEffect(() => {
    audio.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshNodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nodes?root=${rootNode.id}`);
      const data = await res.json();
      setNodes(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = (parent: Node) => {
    // stoppe la lecture globale dès qu'on passe en mode rec
    audio.stop();

    setRecorderParentId(parent.id);

    const branchNodes = getBranchFrom(nodes, parent.id);
    const branch: BranchNode[] = branchNodes.map((n) => ({
      id: n.id,
      audio_url: n.audio_url,
    }));
    setRecorderBranch(branch);

    setRecorderOpen(true);
  };

  const handleCreated = (node: Node) => {
    setNodes((prev) => [...prev, node]);
  };

  const handleNodeSelect = async (node: Node) => {
    setSelectedNode(node);

    const newBranchNodes = getBranchFrom(nodes, node.id);
    const newBranch = newBranchNodes.map((n) => ({
      id: n.id,
      audio_url: n.audio_url,
    }));

    const currentBranchIds = audio.branch.map((b) => b.id);
    const newIds = newBranch.map((b) => b.id);

    const sameBranch =
      currentBranchIds.length === newIds.length &&
      currentBranchIds.every((id, idx) => id === newIds[idx]);

    if (sameBranch) {
      // toggle play / pause
      if (audio.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      return;
    }

    await audio.loadBranch(newBranch);
    audio.play();
  };

return (
<div className="w-full h-screen">
        <div className="absolute inset-0 z-10">
  <NodeGraph
    nodes={nodes}
    topic={rootNode}
    user={null}
    refreshNodes={refreshNodes}
    onNodeSelect={handleNodeSelect}
    onAddChild={handleAddChild}
    selectedNodeId={selectedNode?.id ?? null}
  />
  </div>

  {selectedNode && (
    <div className="absolute inset-0 z-0 pointer-events-none">
    <BranchTimelinePlayer
      selectedNode={selectedNode}
      allNodes={nodes}
    />
    </div>
  )}

        {/* LOADING */}
        {loading && (
          <div className="absolute inset-0 z-[100] bg-black/40 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-t-2 border-yellow-400 rounded-full" />
          </div>
        )}
        {/* RECORDER */}
        <RecorderModal
          open={recorderOpen}
          onClose={() => setRecorderOpen(false)}
          parentId={recorderParentId}
          isRoot={false}
          bpm={rootNode.bpm ?? 120}
          onCreated={handleCreated}
          branch={recorderBranch}
        />
      </div>
  );
}