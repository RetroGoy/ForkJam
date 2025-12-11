"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { useRouter } from "next/navigation";
import UserHeader from "@/components/profil/UserHeader";
import UserNodes from "@/components/profil/UserNodes";
import { useGlobalModal } from "@/components/modals/GlobalModal";

export default function ProfilePage() {
  const router = useRouter();
  const { open } = useGlobalModal();
  const [profile, setProfile] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      // USER ROW
      const { data: userRow } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(userRow);

      // USER'S NODES
      const { data: userNodes } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setNodes(userNodes ?? []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-10">

        <UserHeader
          profile={profile}
          onEdit={() => open("settings")}
        />

        <UserNodes nodes={nodes} />

      </div>
    </div>
  );
}