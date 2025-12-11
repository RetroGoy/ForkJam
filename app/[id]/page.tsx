import { notFound } from "next/navigation";
import { getNode, getChildren } from "@/lib/supabase/supabase";
import { TopicContent } from "@/components/TopicContent";
import { supabase } from "@/lib/supabase/supabase";

export default async function TopicPage(props: { params: Promise<{ id: string }> }) {
  const { params } = props;
  const { id } = await params;

  const topic = await getNode(id);
  if (!topic || !topic.is_root) notFound();

  const nodes = [topic];

  async function loadBranch(parentId: string) {
    const children = await getChildren(parentId);
    for (const child of children) {
      nodes.push(child);
      await loadBranch(child.id);
    }
  }

  await loadBranch(topic.id);

  const { data: { session } } = await supabase.auth.getSession();

  return (
    <>
      <TopicContent rootNode={topic} initialNodes={nodes} />
    </>
  );
}