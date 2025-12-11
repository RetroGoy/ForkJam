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
      <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-t-lg">
        <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
          RESET PASSWORD
        </span>
      </div>

      <div className="p-6 space-y-4">

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-gray-300 text-xs uppercase tracking-wide">
                Your email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-yellow-500"
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
              {loading ? <Loader2 className="animate-spin" /> : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-yellow-400 font-semibold">Email sent!</p>
            <p className="text-gray-400 text-sm">
              Check your inbox and follow the link to reset your password.
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