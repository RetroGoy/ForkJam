"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, User, Mail, Lock, MapPin } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

export function SignUpModal() {
  const { open } = useGlobalModal();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    department: "",
  });

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.department.trim()) {
        throw new Error("Please enter your department");
      }
      if (!accepted) {
        throw new Error("Tu dois accepter les conditions d'utilisation.");
      }

      // SIGN UP (username + département stockés dans les métadonnées auth)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            department: formData.department.trim(),
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      if (signUpError) throw signUpError;

      // Validation email en pause : signUp renvoie une session -> connecté direct.
      if (data.session?.user) {
        await supabase.from("users").insert({
          id: data.session.user.id,
          email: formData.email,
          username: formData.username,
          department: formData.department,
        });
        window.location.href = "/feed";
        return;
      }

      // Fallback si la confirmation par email est (ré)activée côté Supabase.
      setError("");
      setSuccess("Vérifie ta boîte mail pour confirmer ton compte.");
    } catch (err: any) {
      setError(err.message ?? "An unknown error occurred");
    }

    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-yellow-600 to-yellow-400 px-4 py-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
          Create account
        </span>
      </div>

      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSignUp}>
          {/* USERNAME */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                required
                type="text"
                placeholder="forkjammer"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
              />
            </div>
          </div>

          {/* DEPARTMENT */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Department (FR)</label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="69"
                value={formData.department}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    department: e.target.value.replace(/[^\d]/g, "").slice(0, 2),
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
              />
            </div>
          </div>

          {/* CGU */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="accent-yellow-500"
            />
            <span>
              J&apos;accepte les{" "}
              <Link href="/legal" className="text-yellow-400 underline">
                conditions d&apos;utilisation
              </Link>
              .
            </span>
          </label>

          {/* ERRORS */}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
              {success}
            </p>
          )}

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <button
            className="font-semibold text-yellow-400 hover:text-yellow-300"
            onClick={() => open("signin")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}