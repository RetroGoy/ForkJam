"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import AvatarUploader from "@/app/profile/avatarUploader";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const authUser = session.user;
      setUser(authUser);

      // Fetch profile row
      const { data: userDb } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setProfile(userDb);

      // Fetch topics
      const { data: topicData } = await supabase
        .from("topics")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      setTopics(topicData || []);

      // Fetch nodes
      const { data: nodeData } = await supabase
        .from("nodes")
        .select("*, topics(title)")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      setNodes(nodeData || []);

      setIsLoading(false);
    };

    load();
  }, []);

  const handleAvatarUpdate = (url: string) => {
    setProfile((p: any) => ({ ...p, avatar_url: url }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-yellow-400 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">

        {/* INFO HEADER */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-yellow-900/30 flex gap-6">
          
          {/* Avatar */}
          <div>
            <img
              src={profile?.avatar_url || "/default-avatar.png"}
              className="w-24 h-24 rounded-full object-cover border border-yellow-700 shadow"
            />
            <AvatarUploader user={user} onUpload={handleAvatarUpdate} />
          </div>

          {/* User info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">
              {profile?.username || user.email.split("@")[0]}
            </h1>
            <p className="text-gray-400">{profile?.email}</p>
            <p className="text-gray-500 mt-2">
              Member since {new Date(profile?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* TOPICS */}
        <h2 className="text-xl text-yellow-400 font-bold mb-4">Your Topics</h2>
        <div className="space-y-3 mb-10">
          {topics.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/topic/${t.id}`)}
              className="cursor-pointer bg-gray-800 border border-yellow-900/30 hover:bg-gray-700 transition p-4 rounded-lg"
            >
              <h3 className="text-gray-200 font-semibold">{t.title}</h3>
              <p className="text-gray-400 text-sm">{t.description}</p>
            </div>
          ))}
        </div>

        {/* NODES */}
        <h2 className="text-xl text-yellow-400 font-bold mb-4">Your Nodes</h2>
        <div className="space-y-3">
          {nodes.map((n) => (
            <div
              key={n.id}
              onClick={() => router.push(`/topic/${n.topic_id}`)}
              className="cursor-pointer bg-gray-800 border border-yellow-900/30 hover:bg-gray-700 transition p-4 rounded-lg"
            >
              <h3 className="font-semibold text-foreground">{n.title}</h3>
              <div className="text-gray-400 text-sm flex gap-4">
                <span>{n.instrument}</span>
                <span>{n.bpm} BPM</span>
                <span>{n.topics?.title ? `From: ${n.topics.title}` : ""}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}