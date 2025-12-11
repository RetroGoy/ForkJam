import Link from "next/link";
import { Instagram, Youtube, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black/80 text-neutral-400 text-xs">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

        {/* LEFT TEXT */}
        <p className="font-mono">
          © 2025 ForkJam <span className="text-neutral-600">| by</span> Nathanaël Von Eggis
        </p>

        {/* RIGHT NAV + ICONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">

          {/* NAV LINKS */}
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link href="/what-is-forkjam" className="hover:text-neutral-200">
              What is ForkJam
            </Link>
            <span className="text-neutral-600">/</span>

            <Link href="/about" className="hover:text-neutral-200">
              À propos
            </Link>
            <span className="text-neutral-600">/</span>

            <Link href="/contact" className="hover:text-neutral-200">
              Contact
            </Link>
            <span className="text-neutral-600">/</span>

            <Link href="/privacy" className="hover:text-neutral-200">
              Confidentialité
            </Link>
            <span className="text-neutral-600">/</span>

            <Link href="/legal" className="hover:text-neutral-200">
              Mentions légales
            </Link>
          </nav>

        </div>


          {/* SOCIAL ICONS */}
          <div className="flex items-center gap-5 mt-1 sm:mt-0">
            <Link href="https://www.instagram.com/retro.goy/" className="hover:text-neutral-200" target="_blank" aria-label="Instagram">
              <Instagram size={16} />
            </Link>

            <Link href="https://www.youtube.com/@retrogoy" className="hover:text-neutral-200" target="_blank" aria-label="YouTube">
              <Youtube size={16} />
            </Link>

            <Link href="https://github.com/RetroGoy" className="hover:text-neutral-200" target="_blank" aria-label="GitHub">
              <Github size={16} />
            </Link>
            <Link href="https://dumatus.fr" className="hover:text-green-700" target="_blank" aria-label="GitHub">
                <ExternalLink size={16}/>
            </Link>
          </div>

      </div>
    </footer>
  );
}