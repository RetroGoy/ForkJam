"use client";

import React from "react";
import Link from "next/link";
import { User, Menu, ExternalLink, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import Image from "next/image";
import { useTheme } from "next-themes";

export function Header({ hud, onToggleSidebar }: { hud?: React.ReactNode, onToggleSidebar?: () => void }) {  
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

  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-background/70 backdrop-blur-sm mb-0 border-b-1 border-grey-300 px-4">
      <div className="flex justify-between items-center h-14">

<div className="flex items-center gap-3">
  {/* MOBILE MENU BTN */}
  <button
    onClick={onToggleSidebar}
    className="md:hidden text-yellow-300 hover:text-yellow-200"
  >
    <Menu size={28} />
  </button>

  {/* LOGO */}
  <Link href="/" className="flex items-center gap-2 py-1">
    <Image
      src="/logoFj.png"
      alt="Logo ForkJam"
      width={50}
      height={40}
      className="opacity-90"
    />
  </Link>

        <Link
          href="https://dumatus.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-1">
            <ExternalLink size={32} className="fill-black text-yellow-300 " />
        </Link>

    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded bg-muted hover:bg-muted-foreground/10 transition">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
</div>

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