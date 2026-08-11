"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, Lock } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

export function ResetPasswordModal() {
  const { close } = useGlobalModal();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pw1 !== pw2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-yellow-600 to-yellow-400 px-4 py-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-black">
          New password
        </span>
      </div>

      <div className="space-y-4 p-6">

        {!done ? (
          <form onSubmit={submit} className="space-y-4">

            {/* PASSWORD 1 */}
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                New password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  required
                  type="password"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                />
              </div>
            </div>

            {/* PASSWORD 2 */}
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Confirm password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  required
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Reset password"}
            </button>

          </form>
        ) : (
          <div className="space-y-3 text-center">
            <p className="font-semibold text-yellow-400">Password updated!</p>
            <p className="text-sm text-muted-foreground">
              You can now sign in with your new password.
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