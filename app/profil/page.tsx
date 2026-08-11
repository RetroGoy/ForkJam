"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabase";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Music2, Settings } from "lucide-react";
import { useGlobalModal } from "@/components/modals/GlobalModal";
import AvatarUploader from "./avatarUploader";

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

      const { data: userRow } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(userRow);

      const { data: userNodes } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setNodes(userNodes ?? []);
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        Chargement…
      </div>
    );
  }

  const initial = (profile?.username ?? profile?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background bg-dot-pattern p-6">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* HEADER */}
        <section className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-2xl font-bold text-yellow-400">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              {profile?.username ?? "Utilisateur"}
            </h1>
            {profile?.email && (
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              {profile?.department && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> Dépt {profile.department}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                <Music2 size={12} /> {nodes.length} node{nodes.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="pt-2">
              <AvatarUploader
                user={profile}
                onUpload={(url: string) => setProfile((p: any) => ({ ...p, avatar_url: url }))}
              />
            </div>
          </div>

          <button
            onClick={() => open("settings")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-white/10 hover:text-foreground"
          >
            <Settings size={16} /> Paramètres
          </button>
        </section>

        {/* NODES */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Mes créations</h2>

          {nodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas encore créé de node.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {nodes.map((node) => (
                <Link
                  key={node.id}
                  href={`/${node.id}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <h3 className="truncate font-semibold text-foreground group-hover:text-yellow-400">
                    {node.title || "Sans titre"}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {node.instrument && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        {node.instrument}
                      </span>
                    )}
                    {node.is_root && (
                      <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-yellow-400">
                        Racine
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
