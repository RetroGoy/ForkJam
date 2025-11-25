"use client";

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from "next/image";

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
    <header className="bg-gray-900/60 m-2 mt-3">
        <div className="flex justify-between items-center h-24">

          <Link href="/" className="flex items-center p-2">
            <Image
              src="/logoTitle.png"
              alt="Logo Druide500"
              width={150}
              height={50} />
            <Image
              src="/logoFj.png"
              alt="Logo"
              width={90}
              height={50} />
          </Link>

          <div className="flex items-center p-2">
            <button 
              onClick={handleUserClick}
              className="px-4 py-2 m-4 flex items-center gap-2 text-2xl font-bold text-primary border-2 border-primary" >
              <User size={26} />
              <span>{user ? user.email.split('@')[0].toUpperCase() : 'CONNECT'}</span>
            </button>
          </div>
        </div>
    </header>
  );
}