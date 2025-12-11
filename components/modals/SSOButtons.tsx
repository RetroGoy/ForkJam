"use client";

import { supabase } from "@/lib/supabase/supabase";
import { Apple, Guitar, Locate } from "lucide-react";         // Apple icon

export function SSOButtons() {
  
  const oauth = async (provider: "google" | "github" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="mt-6 space-y-2">

      {/* Google */}
      <button
        onClick={() => oauth("google")}
        className="w-full flex items-center justify-center gap-3 py-2 rounded-md bg-white text-black font-medium hover:bg-neutral-200 transition border border-neutral-300"
      >
        <Guitar size={20} />
        Continue with Google
      </button>

      {/* GitHub */}
      <button
        onClick={() => oauth("github")}
        className="w-full flex items-center justify-center gap-3 py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition border border-neutral-700"
      >
        <Locate size={16} />
        Continue with GitHub
      </button>

      {/* Apple (optionnel, mais intégré proprement) */}
      <button
        onClick={() => oauth("apple")}
        className="w-full flex items-center justify-center gap-3 py-2 rounded-md bg-black text-white hover:bg-neutral-900 transition border border-neutral-800"
      >
        <Apple size={18} />
        Continue with Apple
      </button>

    </div>
  );
}