"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { Loader2, User, Mail, Lock, MapPin } from "lucide-react";
import { useGlobalModal } from "./GlobalModal";

export function SignUpModal() {
  const { close, open } = useGlobalModal();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    department: "",
  });

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

      // SIGN UP (username + département stockés dans les métadonnées auth)
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

      // FORCE SESSION
      await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(""); 
        setSuccess("Please check your email to confirm your account");
        return;
      }

      // INSERT PROFILE (LE SEUL)
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: formData.email,
        username: formData.username,
        department: formData.department,
      });
      if (insertError) throw insertError;

      close();
      open("signin");

      close();
      open("signin");
    } catch (err: any) {
      setError(err.message ?? "An unknown error occurred");
    }

    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-t-lg">
        <span className="text-xs font-black tracking-[0.25em] text-black uppercase">
          CREATE ACCOUNT
        </span>
      </div>

      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSignUp}>
          {/* USERNAME */}
          <div>
            <label className="text-gray-300 text-xs uppercase tracking-wide">Username</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                required
                type="text"
                placeholder="forkjammer"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-gray-300 text-xs uppercase tracking-wide">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>

          {/* DEPARTMENT */}
          <div>
            <label className="text-gray-300 text-xs uppercase tracking-wide">Department (FR)</label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
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
                className="w-full pl-10 pr-3 py-2 bg-gray-800/80 border border-gray-700 text-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>

          {/* ERRORS */}
          {error && (
            <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-xs bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition disabled:bg-yellow-900 disabled:text-gray-400"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create account"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4 text-xs">
          Already have an account?{" "}
          <button
            className="text-yellow-400 underline"
            onClick={() => open("signin")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}