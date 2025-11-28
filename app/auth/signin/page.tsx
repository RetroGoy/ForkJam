"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword(formData);
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h1 className="text-3xl text-yellow-500 font-bold mb-4">Se connecter</h1>

        <form className="space-y-4" onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-yellow-600 py-2 rounded hover:bg-yellow-500"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Pas de compte ?{" "}
          <Link href="/auth/signup" className="text-yellow-400 underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}