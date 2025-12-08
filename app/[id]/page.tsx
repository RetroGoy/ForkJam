import { notFound } from "next/navigation";
import { getNode, getChildren } from "@/lib/supabase/supabase";
import { TopicContent } from "@/components/TopicContent";
import { ReactFlowProvider } from "reactflow";
import { GraphWrapper } from "@/components/graph/GraphWrapper";

export default async function TopicPage(props: { params: Promise<{ id: string }> }) {

  const { id } = await props.params;

  const topic = await getNode(id);

  if (!topic || !topic.is_root) {
    notFound();
  }

  const nodes: any[] = [topic];

  async function loadBranch(parentId: string) {
    const children = await getChildren(parentId);
    for (const child of children) {
      nodes.push(child);
      await loadBranch(child.id);
    }
  }

  await loadBranch(topic.id);

  return (
    <GraphWrapper>
    <TopicContent
      rootNode={topic}
      initialNodes={nodes}
    />
    </GraphWrapper>
  );
}