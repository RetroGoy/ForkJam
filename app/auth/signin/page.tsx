"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword(formData);
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/60 shadow-[0_0_40px_rgba(0,0,0,0.7)] overflow-hidden relative">
        {/* Bandeau titre style "fenêtre OS" */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500">
          <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
            SIGN IN
          </span>
        </div>

        <div className="p-6">

          <form className="space-y-4" onSubmit={handleSignIn}>
            {/* Email */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-gray-100 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
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
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-gray-100 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Errors */}
            {error && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/40 rounded-md px-3 py-2 mt-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-yellow-600 py-2 hover:bg-yellow-500 text-black font-semibold rounded-md flex items-center justify-center gap-2 mt-2 transition disabled:bg-yellow-900 disabled:text-gray-400"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Connecting…
                </>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>

          <p className="text-gray-400 text-xs mt-4 text-center">
            No account yet?{" "}
            <Link href="/auth/signup" className="text-yellow-400 underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}