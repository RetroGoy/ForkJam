"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Plus, Bell, Settings } from "lucide-react";
import { useGlobalModal } from "@/components/modals/GlobalModal";

function SidebarIcon({ icon: Icon, label, active, accent, onClick }: any) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          accent
            ? "bg-yellow-400 text-black shadow-lg shadow-yellow-900/30 hover:bg-yellow-300"
            : active
            ? "bg-yellow-400/15 text-yellow-300"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        <Icon size={24} />
      </button>

      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-[8px] bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useGlobalModal();

  const nav = [
    { label: "Home", href: "/feed", icon: Home },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Notifications", onClick: () => open("notifications"), icon: Bell },
  ];

  const isActive = (href?: string) =>
    !!href && (pathname === href || pathname.startsWith(href));

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-16 items-center justify-center">
        <Link href="/feed">
          <Image
            src="/logoFj.png"
            width={40}
            height={38}
            alt="ForkJam"
            className="opacity-90 transition hover:opacity-100"
          />
        </Link>
      </div>

      <nav className="mt-4 flex flex-1 flex-col items-center gap-5">
        {nav.map(({ label, href, onClick, icon }) => (
          <SidebarIcon
            key={label}
            icon={icon}
            label={label}
            active={isActive(href)}
            onClick={onClick ?? (() => router.push(href!))}
          />
        ))}

        <SidebarIcon
          icon={Plus}
          label="Create"
          accent
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("forkjam:open-recorder", { detail: { mode: "root" } })
            )
          }
        />
      </nav>

      <div className="flex flex-col items-center gap-4 py-4">
        <SidebarIcon
          icon={Settings}
          label="Settings"
          onClick={() => open("settings")}
        />
      </div>
    </div>
  );
}
