"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useGlobalModal } from "@/components/modals/GlobalModal";

type AuthMode = "signin" | "signup";

export function PublicHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<AuthMode | null>(null);
  const { open } = useGlobalModal();

  React.useEffect(() => setMounted(true), []);

  const isActive = (href: string) => pathname === href;

  const openAuth = (mode: AuthMode) => {
    window.dispatchEvent(new CustomEvent("forkjam:open-auth", { detail: { mode } }));
  };

  const ThemeButton = mounted ? (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded bg-muted hover:bg-muted/80 transition"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  ) : <div className="p-2 opacity-0" />;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        {/* LOGO + NAV */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logoFj.png" alt="ForkJam logo" width={40} height={32} className="opacity-90" />
            <span className="font-black tracking-[0.2em] text-xs sm:text-sm text-yellow-400">FORKJAM</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="/" className={isActive("/") ? "text-foreground" : "hover:text-foreground"}>
              Home
            </Link>
            <button
              onClick={() => document.getElementById("landing-gallery")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-foreground"
            >
              Explore
            </button>
            <Link href="/about" className={isActive("/about") ? "text-foreground" : "hover:text-foreground"}>
              About
            </Link>
            <Link href="/contact" className={isActive("/contact") ? "text-foreground" : "hover:text-foreground"}>
              Contact
            </Link>
          </nav>
        </div>

        {/* THEME + AUTH */}
        <div className="flex items-center gap-3">
          {ThemeButton}

          <button
            onClick={() => open("signin")}
            className="hidden sm:inline-flex items-center justify-center rounded-sm border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            Sign in
          </button>

          <button
            onClick={() => open("signup")}
            className="inline-flex items-center justify-center rounded-sm bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-yellow-300"
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}