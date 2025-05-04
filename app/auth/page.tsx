"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      setError('Check your email to confirm your account');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-widest mb-2">DRUIDE 500</h1>
          <p className="text-gray-400">Sign in to collaborate on musical projects</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-yellow-900/30">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-gray-100"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-gray-100"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm py-2">{error}</div>
            )}

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-700 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors disabled:bg-yellow-900 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 px-4 rounded-md transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}