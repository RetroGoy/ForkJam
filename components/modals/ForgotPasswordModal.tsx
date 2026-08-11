"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, Mail } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

export function ForgotPasswordModal() {
  const { close } = useGlobalModal();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-yellow-600 to-yellow-400 px-4 py-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
          Reset password
        </span>
      </div>

      <div className="space-y-4 p-6">

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Your email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <p className="font-semibold text-yellow-400">Email sent!</p>
            <p className="text-sm text-muted-foreground">
              Check your inbox and follow the link to reset your password.
            </p>

            <button
              onClick={close}
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}