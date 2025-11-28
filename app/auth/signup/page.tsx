"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, User, Mail, Lock } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Créer l'utilisateur dans auth.users
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) throw new Error("Unable to create user.");

      // 2️⃣ Créer le profil dans public.users
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: formData.email,
        username: formData.username,
      });

      if (insertError) throw insertError;

      router.push("/auth/signin");

    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-md p-6 rounded-lg shadow-xl border border-yellow-900/30">
        <h1 className="text-3xl font-bold text-yellow-500 tracking-widest mb-6">
          Create Account
        </h1>

        <form className="space-y-4" onSubmit={handleSignUp}>
          {/* Username */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
              <input
                required
                type="text"
                placeholder="john"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-1 focus:ring-yellow-600"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-1 focus:ring-yellow-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-1 focus:ring-yellow-600"
              />
            </div>
          </div>

          {/* Errors */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Submit */}
          <button
            disabled={loading}
            className="w-full bg-yellow-700 hover:bg-yellow-600 text-white py-2 rounded-md flex items-center justify-center gap-2 transition disabled:bg-yellow-900"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin"/> Creating...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-yellow-400 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}