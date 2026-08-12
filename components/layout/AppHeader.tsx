"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { useRouter, usePathname } from "next/navigation";

// Page de graphe = /{uuid}
const UUID_RE =
  /^\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const hideSearch = pathname === "/feed" || UUID_RE.test(pathname);
  const isExplore = pathname === "/explore";

  return (
    <header className="relative flex h-14 items-center gap-3 bg-background/60 px-4 backdrop-blur">
      {hideSearch ? (
        <>
          {/* < md : titre centré horizontalement (absolu) ; ≥ md : aligné à gauche */}
          <Link
            href="/feed"
            className="flex items-center gap-2 max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2"
          >
            <Image
              src="/logoFj.png"
              alt="ForkJam"
              width={28}
              height={24}
              className="opacity-90 md:hidden"
            />
            <span className="text-md font-black tracking-[0.2em] text-yellow-400">
              FORKJAM
            </span>
          </Link>
          <div className="flex-1" />
        </>
      ) : (
        <div className="min-w-0 flex-1">
          <GlobalSearchBar />
        </div>
      )}

      {/* flèche uniquement sur la page Explore */}
      {isExplore && (
        <button
          onClick={() => router.push("/explore")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted hover:bg-muted/80"
        >
          <ArrowRight size={20} />
        </button>
      )}
    </header>
  );
}
