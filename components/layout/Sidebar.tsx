"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Plus, Bell, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useGlobalModal } from "@/components/modals/GlobalModal";

function SidebarIcon({ icon: Icon, label, active, onClick }: any) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          flex items-center justify-center w-11 h-11 rounded-xl transition
          ${active 
            ? "bg-yellow-400/20 text-yellow-300"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }
        `}
      >
        <Icon size={26} />
      </button>

      {/* Tooltip */}
      <span
        className="
          pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2
          whitespace-nowrap text-xs px-2 py-1 rounded-xl
          bg-black text-white opacity-0 z-50
          translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 
          transition-all duration-150
        "
      >
        {label}
      </span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { open } = useGlobalModal();

  const nav = [
    { label: "Home", href: "/feed", icon: Home },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Notifications", onClick: () => open("notifications"), icon: Bell },
  ];

  const isActive = (href?: string) =>
    href && (pathname === href || pathname.startsWith(href));

  return (
    <aside className="flex flex-col h-full w-16 border-r border-border bg-background/95 backdrop-blur">

      {/* LOGO */}
      <div className="h-16 flex items-center justify-center">
        <Link href="/feed">
          <Image
            src="/logoFj.png"
            width={40}
            height={38}
            alt="ForkJam"
            className="opacity-90"
          />
        </Link>
      </div>

      {/* NAV */}
      <nav className="flex flex-col items-center gap-6 mt-4 flex-1">

        {nav.map(({ label, href, onClick, icon }) => (
          <SidebarIcon
            key={label}
            icon={icon}
            label={label}
            active={href && isActive(href)}
            onClick={onClick ?? (() => router.push(href!))}
          />
        ))}

        {/* CREATE */}
        <SidebarIcon
          icon={Plus}
          label="Create"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("forkjam:open-recorder", { detail: { mode: "root" } })
            )
          }
        />
      </nav>

      {/* FOOTER */}
      <div className="flex flex-col items-center gap-4 py-4">
{/* 
        <SidebarIcon
          icon={theme === "dark" ? Sun : Moon}
          label="Theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
 */}
        <SidebarIcon
          icon={Settings}
          label="Settings"
          onClick={() => open("settings")}
        />
      </div>
    </aside>
  );
}
