"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
  setIsLoading(true);
  setError('');

  try {
    // Step 1 : inscription Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (signUpError) throw signUpError;

    const user = data.user;
    if (!user) throw new Error("User not returned by Supabase.");

    // Step 2 : créer l'utilisateur dans public.users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: user.id,            // même UUID que auth.users
        username: formData.email.split('@')[0], // ou un champ username plus tard
        email: formData.email
      });

    if (dbError) throw dbError;

    // Step 3 : prévenir l’utilisateur
    setError('Check your email to confirm your account');

  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background bg-dot-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow-lg">FORKJAM</h1>
          <p className="text-muted-foreground">Connectez-vous pour collaborer sur vos projets musicaux</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-foreground outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/60"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-4 py-2.5 font-bold text-black shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Traitement…</span>
                  </>
                ) : (
                  <span>Se connecter</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-foreground/80 transition hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Créer un compte
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}