"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, User, Mail, Lock, MapPin } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    department: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.department.trim()) {
        throw new Error("Please enter your department number.");
      }

      // 1️⃣ Créer l'utilisateur dans auth.users (+ métadonnées)
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

      // Validation email en pause : session renvoyée -> connecté direct.
      if (data.session?.user) {
        await supabase.from("users").insert({
          id: data.session.user.id,
          email: formData.email,
          username: formData.username,
          department: formData.department.trim(),
        });
        router.push("/feed");
        return;
      }

      // Fallback si la confirmation par email est (ré)activée côté Supabase.
      setError("Vérifie ta boîte mail pour confirmer ton compte.");
    } catch (err: any) {
      setError(err.message ?? "An error occurred.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background bg-dot-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl">
        {/* Bandeau titre style "fenêtre OS" */}
        <div className="relative flex items-center justify-center bg-yellow-400 px-4 py-2.5">
          <Link href="/" className="absolute left-3 top-1/2 -translate-y-1/2">
            <span className="text-lg font-bold text-black transition hover:opacity-70">←</span>
          </Link>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
            Créer un compte
          </span>
        </div>

        <div className="p-6">

          <form className="space-y-4" onSubmit={handleSignUp}>
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  required
                  type="text"
                  placeholder="forkjammer"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Department (FR)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="\d{2}"                   // ← 2 chiffres obligatoires
                  placeholder="69"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value
                        .replace(/[^\d]/g, "")       // garde que chiffres
                        .slice(0, 2),                // ← limite à 2 chiffres
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Used to surface topics from your area first (e.g. 69, 75, 33…)
              </p>
            </div>

            {/* Errors */}
            {error && (
              <p className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-2.5 font-bold text-black shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Création…
                </>
              ) : (
                "Créer un compte"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/auth/signin" className="font-semibold text-yellow-400 hover:text-yellow-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}