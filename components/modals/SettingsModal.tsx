"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, User, MapPin } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

type Profile = {
  id: string;
  username: string;
  department: string | null;
};

export function SettingsModal() {
  const { close } = useGlobalModal();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Chargement du profil
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

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile", error);
          setLoading(false);
          return;
        }

        if (!data) {
          // fallback si aucune ligne dans users
          setProfile({
            id: user.id,
            username: user.user_metadata?.username ?? "",
            department: null,
          });
        } else {
          setProfile({
            id: data.id,
            username: data.username ?? "",
            department: data.department ?? null,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("users")
      .update({
        username: profile.username,
        department: profile.department,
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    close();
  };

  if (loading || !profile) {
    return (
      <div className="py-10 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin" />
        <p className="text-xs text-gray-400">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* BARRE DE TITRE */}
      <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-t-lg">
        <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
          SETTINGS
        </span>
      </div>

      <div className="p-6 space-y-4">
        {/* USERNAME */}
        <div>
          <label className="text-gray-300 text-xs uppercase">Username</label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm"
            />
          </div>
        </div>

        {/* DEPARTMENT */}
        <div>
          <label className="text-gray-300 text-xs uppercase">Department (FR)</label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={profile.department ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  department: e.target.value.replace(/[^\d]/g, "").slice(0, 2),
                })
              }
              className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/40 px-3 py-2 rounded">
            {error}
          </p>
        )}

        {/* SAVE */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" /> : "Save changes"}
        </button>
      </div>
    </div>
  );
}