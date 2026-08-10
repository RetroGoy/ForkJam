"use client";

import { Home, Compass, PlusCircle, Bell, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useGlobalModal } from "@/components/modals/GlobalModal";

export function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useGlobalModal();

  const openCreate = () =>
    window.dispatchEvent(
      new CustomEvent("forkjam:open-recorder", { detail: { mode: "root" } })
    );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href);

  const item = (active: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-xl transition ${
      active
        ? "bg-yellow-400/15 text-yellow-300"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur md:hidden">
      <button onClick={() => router.push("/feed")} className={item(isActive("/feed"))}>
        <Home size={20} />
      </button>

      <button
        onClick={() => router.push("/explore")}
        className={item(isActive("/explore"))}
      >
        <Compass size={20} />
      </button>

      <button
        onClick={openCreate}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg shadow-yellow-900/30 transition hover:bg-yellow-300"
      >
        <PlusCircle size={26} />
      </button>

      <button onClick={() => open("notifications")} className={item(false)}>
        <Bell size={20} />
      </button>

      <button onClick={() => open("settings")} className={item(false)}>
        <Settings size={20} />
      </button>
    </nav>
  );
}
