"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";

type AuthMode = "signin" | "signup";

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
}

export function AuthModal({ mode, onClose }: AuthModalProps) {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (currentMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
        });
        if (error) throw error;
      }

      onClose();
      router.push("/feed");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {currentMode === "signin" ? "Connexion" : "Créer un compte"}
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 text-sm border-b border-border">
          <button
            onClick={() => setCurrentMode("signin")}
            className={`flex-1 pb-2 text-center ${
              currentMode === "signin"
                ? "border-b-2 border-yellow-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setCurrentMode("signup")}
            className={`flex-1 pb-2 text-center ${
              currentMode === "signup"
                ? "border-b-2 border-yellow-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:ring-1 focus:ring-yellow-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:ring-1 focus:ring-yellow-400"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete={
              currentMode === "signup" ? "new-password" : "current-password"
            }
          />

          {errorMsg && (
            <p className="text-xs text-red-400 whitespace-pre-line">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading
              ? "Patiente..."
              : currentMode === "signin"
              ? "Se connecter"
              : "Créer un compte"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
}