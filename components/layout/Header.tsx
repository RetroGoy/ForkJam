"use client";

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function Header() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserClick = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/auth');
    }
  };

  return (
    <header className="bg-gray-900 border-b-2 border-yellow-900/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-[0.3em] text-yellow-500">DRUIDE</span>
            <span className="text-3xl font-mono text-yellow-600">5000</span>
          </Link>

          <div className="flex items-center space-x-6">
            <button 
              onClick={handleUserClick}
              className="retro-button px-4 py-2 flex items-center gap-2"
            >
              <User size={16} />
              <span>{user ? user.email.split('@')[0].toUpperCase() : 'CONNECT'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}