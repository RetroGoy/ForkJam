"use client";

import { Home, Compass, PlusCircle, Bell, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalModal } from "@/components/modals/GlobalModal";

export function BottomBar() {
  const router = useRouter();
  const { open } = useGlobalModal();

  const openCreate = () =>
    window.dispatchEvent(new CustomEvent("forkjam:open-recorder", { detail: { mode: "root" } }));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden justify-around items-center h-14 border-t border-border bg-background/95 backdrop-blur">
      <button onClick={() => router.push("/feed")} className="flex flex-col items-center text-xs">
        <Home size={20} />
      </button>

      <button onClick={() => router.push("/explore")} className="flex flex-col items-center text-xs">
        <Compass size={20} />
      </button>

      <button onClick={openCreate} className="flex flex-col items-center text-xs text-yellow-300">
        <PlusCircle size={28} />
      </button>

      <button onClick={() => open("notifications")} className="flex flex-col items-center text-xs">
        <Bell size={20} />
      </button>

      <button onClick={() => router.push("/profil")} className="flex flex-col items-center text-xs">
        <User size={20} />
      </button>
    </nav>
  );
}