"use client";

import { useEffect, useState } from "react";
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background border border-border rounded-xl p-8 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Connexion</h2>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm"
            onChange={(e) => setPass(e.target.value)}
          />

          <button
            onClick={signIn}
            className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-md hover:bg-yellow-300 transition"
          >
            Se connecter
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}