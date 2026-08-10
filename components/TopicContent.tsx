"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { NodeGraph } from "@/components/graph/NodeGraph";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import { BranchTimelinePlayer } from "@/components/audio/ui/BranchTimelinePlayer";
import {
  supabase,
  getVotesForNodes,
  toggleNodeVote,
  type Node,
} from "@/lib/supabase/supabase";
import { useAudioEngine } from "@/components/audio/hooks/useAudioEngine";
import { getBranchFrom } from "@/lib/utils/getBranchFrom";

type VoteValue = 1 | -1 | 0;

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
  const [recorderParentNodes, setRecorderParentNodes] = useState<Node[]>([]);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<Record<string, VoteValue>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const audio = useAudioEngine();

  useEffect(() => {
    audio.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Somme des votes de tous les nodes du topic = note de la carte topic.
  const aggregate = useMemo(
    () => Object.values(scores).reduce((a, b) => a + b, 0),
    [scores]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      const votes = await getVotesForNodes(nodes.map((n) => n.id));
      if (cancelled) return;

      const s: Record<string, number> = {};
      const uv: Record<string, VoteValue> = {};
      for (const v of votes) {
        s[v.target_id] = (s[v.target_id] ?? 0) + v.value;
        if (user && v.user_id === user.id) uv[v.target_id] = v.value as VoteValue;
      }
      setScores(s);
      setUserVotes(uv);
    })();
    return () => {
      cancelled = true;
    };
  }, [nodes]);

  const handleVote = async (nodeId: string, value: 1 | -1) => {
    if (!userId) {
      toast.error("Connecte-toi pour voter");
      return;
    }

    const prevVote = userVotes[nodeId] ?? 0;
    const nextVote: VoteValue = prevVote === value ? 0 : value;
    const delta = nextVote - prevVote;

    setUserVotes((p) => ({ ...p, [nodeId]: nextVote }));
    setScores((p) => ({ ...p, [nodeId]: (p[nodeId] ?? 0) + delta }));

    const ok = await toggleNodeVote(nodeId, value);
    if (!ok) {
      setUserVotes((p) => ({ ...p, [nodeId]: prevVote }));
      setScores((p) => ({ ...p, [nodeId]: (p[nodeId] ?? 0) - delta }));
      toast.error("Vote non enregistré");
    }
  };

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

    const fullParents = branch
      .map((b) => nodes.find((n) => n.id === b.id))
      .filter((n): n is Node => !!n);
    setRecorderParentNodes(fullParents);

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
<div className="w-full h-full">
        <div className="absolute inset-0 z-10">
  <NodeGraph
    nodes={nodes}
    topic={rootNode}
    user={null}
    refreshNodes={refreshNodes}
    onNodeSelect={handleNodeSelect}
    onAddChild={handleAddChild}
    selectedNodeId={selectedNode?.id ?? null}
    scores={scores}
    aggregate={aggregate}
    userVotes={userVotes}
    onVote={handleVote}
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
          parentNodes={recorderParentNodes}
        />
      </div>
  );
}