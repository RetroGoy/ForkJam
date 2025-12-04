import { create } from 'zustand';
import { supabase } from '@/lib/supabase/supabase';

type UserState = {
  user: any;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useUser = create<UserState>((set) => ({
  user: null,
  fetchUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
