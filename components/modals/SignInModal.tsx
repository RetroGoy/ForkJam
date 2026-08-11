"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, Mail, Lock } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

export function SignInModal() {
  const { close, open } = useGlobalModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-yellow-600 to-yellow-400 px-4 py-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
          Sign in
        </span>
      </div>

      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSignIn}>

          {/* EMAIL */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <button
            className="font-semibold text-yellow-400 hover:text-yellow-300"
            onClick={() => open("forgot")}
          >
            Forgot password?
          </button>
        </p>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          No account?{" "}
          <button
            className="font-semibold text-yellow-400 hover:text-yellow-300"
            onClick={() => open("signup")}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}