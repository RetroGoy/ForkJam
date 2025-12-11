"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, Mail, Lock } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";
import Link from "next/link";
import { SSOButtons } from "./SSOButtons";

export function SignInModal() {
  const { close, open } = useGlobalModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("You must accept the Terms of Service.");
      return;
    }

    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    close();
  };

  return (
    <div className="w-full">
      {/* TITLE BAR */}
      <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-t-lg">
        <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
          SIGN IN
        </span>
      </div>

      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSignIn}>
          
          {/* EMAIL */}
          <div>
            <label className="text-gray-300 text-xs uppercase tracking-wide">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-gray-300 text-xs uppercase tracking-wide">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>

          {/* CGU */}
          <div className="flex items-center gap-2 text-xs text-gray-300 mt-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="accent-yellow-500"
            />
            <span>
              I accept the{" "}
              <Link href="/legal" className="text-yellow-400 underline">
                Terms of Service
              </Link>.
            </span>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition disabled:bg-yellow-900 disabled:text-gray-400"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
          </button>
        </form>

        <div className="mt-6 space-y-2">

        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
            <button
            className="text-yellow-400 underline"
            onClick={() => open("forgot")}
            >
            Forgot password?
            </button>
        </p>

        <p className="text-gray-400 text-center mt-4 text-xs">
          No account?{" "}
          <button
            className="text-yellow-400 underline"
            onClick={() => open("signup")}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}