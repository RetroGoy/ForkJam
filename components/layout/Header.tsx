"use client";

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import Image from "next/image";

export function Header({ hud }: { hud?: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUser(session?.user ?? null)
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleUserClick = () => {
    router.push(user ? "/profile" : "/auth/signin");
  };

  return (
    <header className="bg-black/25 backdrop-blur-sm m-2 mb-0 px-4">
      <div className="flex justify-between items-center h-14">

        {/* LEFT : LOGO */}
        <Link href="/" className="flex items-center gap-2 py-1">
          <Image
            src="/logoFj.png"
            alt="Logo ForkJam"
            width={50}
            height={40}
            className="opacity-90"
          />
        </Link>

        {/* MIDDLE : HUD */}
        <div className="flex-1 flex justify-center">
          {hud}
        </div>

        {/* RIGHT : USER */}
        <button
          onClick={handleUserClick}
          className="
            px-3 py-1.5 mx-2 flex items-center gap-2
            text-lg font-bold text-yellow-300
            border border-yellow-700 
            rounded-sm bg-black/20
            hover:bg-black/30 hover:border-yellow-500
            transition
          "
        >
          <User size={22} />
          <span>
            {user ? user.email.split("@")[0].toUpperCase() : "CONNECT"}
          </span>
        </button>
      </div>
    </header>
  );
}