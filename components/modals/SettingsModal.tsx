"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, MapPin, LogOut } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

type Profile = {
  id: string;
  department: string | null;
};

export function SettingsModal() {
  const { close } = useGlobalModal();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("id, department")
          .eq("id", user.id)
          .maybeSingle();

        setProfile({ id: user.id, department: data?.department ?? null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError("");

    // Métadonnées auth = source lue par createNode (pas de RLS requise)
    await supabase.auth.updateUser({ data: { department: profile.department } });

    const { error } = await supabase
      .from("users")
      .update({ department: profile.department })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    close();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="animate-spin" />
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-yellow-600 to-yellow-400 px-4 py-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
          Settings
        </span>
      </div>

      <div className="space-y-4 p-6">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Ta région (département FR)
          </label>
          <div className="relative mt-1">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={16}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="69"
              value={profile.department ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  department: e.target.value.replace(/[^\d]/g, "").slice(0, 2),
                })
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Utilisée par le filtre « Proche » et affichée sur tes nodes.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-2 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Enregistrer"}
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
