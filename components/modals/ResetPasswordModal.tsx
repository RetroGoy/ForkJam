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
      <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-t-lg">
        <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
          NEW PASSWORD
        </span>
      </div>

      <div className="p-6 space-y-4">

        {!done ? (
          <form onSubmit={submit} className="space-y-4">

            {/* PASSWORD 1 */}
            <div>
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                New password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  required
                  type="password"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* PASSWORD 2 */}
            <div>
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Confirm password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  required
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/40 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition disabled:bg-yellow-900 disabled:text-gray-400"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Reset password"}
            </button>

          </form>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-yellow-400 font-semibold">Password updated!</p>
            <p className="text-gray-400 text-sm">
              You can now sign in with your new password.
            </p>

            <button
              onClick={close}
              className="w-full px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-sm hover:bg-gray-700 transition text-gray-300"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}