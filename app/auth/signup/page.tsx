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
        },
      });

      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) throw new Error("Unable to create user.");

      // 2️⃣ Créer le profil dans public.users (avec département)
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: formData.email,
        username: formData.username,
        department: formData.department.trim(), // stocké en string (ex: "69")
      });

      if (insertError) throw insertError;

      router.push("/auth/signin");
    } catch (err: any) {
      setError(err.message ?? "An error occurred.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/60 shadow-[0_0_40px_rgba(0,0,0,0.7)] overflow-hidden relative">
        {/* Bandeau titre style "fenêtre OS" */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500">
          <Link href="/" className="absolute left-3 top-1/2 -translate-y-1/2">
            <span className="text-black text-lg font-bold hover:opacity-70">←</span>
          </Link>
          <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
            CREATE ACCOUNT
          </span>
        </div>

        <div className="p-6">

          <form className="space-y-4" onSubmit={handleSignUp}>
            {/* Username */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  required
                  type="text"
                  placeholder="forkjammer"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-foreground text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-foreground text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-foreground text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Department (FR)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
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
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-foreground text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Used to surface topics from your area first (e.g. 69, 75, 33…)
              </p>
            </div>

            {/* Errors */}
            {error && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/40 rounded-md px-3 py-2 mt-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition disabled:bg-yellow-900 disabled:text-gray-400 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-gray-400 text-center mt-4 text-xs">
            Already connected to the grid?{" "}
            <Link href="/auth/signin" className="text-yellow-400 underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}