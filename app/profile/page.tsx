"use client";
import { useUser } from "@/store/useUser";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Node } from '@/lib/supabase';
import { LogOut, Music, Clock } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userNodes, setUserNodes] = useState<Node[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }
      
      setUser(session.user);
      
      // Fetch user's nodes
      const { data: nodes } = await supabase
        .from('nodes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      setUserNodes(nodes || []);
      setIsLoading(false);
    };

    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-yellow-900/30">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-yellow-500 mb-2">
                {user?.email.split('@')[0].toUpperCase()}
              </h1>
              <p className="text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 px-4 py-2 rounded-md transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-md">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Music size={18} />
                <h2 className="font-semibold">Your Contributions</h2>
              </div>
              <p className="text-2xl font-bold text-gray-200">{userNodes.length}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-md">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Clock size={18} />
                <h2 className="font-semibold">Member Since</h2>
              </div>
              <p className="text-gray-200">
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">Recent Contributions</h2>
          {userNodes.map((node: any) => (
            <div
              key={node.id}
              className="bg-gray-800 rounded-lg p-4 border border-yellow-900/30"
            >
              <h3 className="font-semibold text-gray-200 mb-2">{node.title}</h3>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>{node.instrument}</span>
                <span>{node.bpm} BPM</span>
                <span>{new Date(node.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}