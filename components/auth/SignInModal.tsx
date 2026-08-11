"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";

export function SignInModal() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (!error) router.push("/feed");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Connexion</h2>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
            onChange={(e) => setPass(e.target.value)}
          />

          <button
            onClick={signIn}
            className="rounded-full bg-yellow-400 px-4 py-2.5 font-bold text-black transition hover:bg-yellow-300"
          >
            Se connecter
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
