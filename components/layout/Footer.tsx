import Link from "next/link";
import { Instagram, Youtube, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black/80 text-neutral-400 text-xs">
      <div className="mx-auto max-w-5xl px-4 py-3">

        {/* WRAPPER SCROLLABLE EN MOBILE */}
        <div className="flex items-center gap-10 w-full overflow-x-auto sm:overflow-visible no-scrollbar">

          {/* LEFT TEXT */}
          <p className="font-mono flex-shrink-0">
            © 2025 ForkJam <span className="text-neutral-600">| by</span> Nathanaël Von Eggis
          </p>

          {/* NAV LINKS */}
          <nav className="flex items-center gap-3 flex-shrink-0">
            <Link href="/what-is-forkjam" className="hover:text-neutral-200">What is ForkJam</Link>
            <span className="text-neutral-600">/</span>

            <Link href="/about" className="hover:text-neutral-200">À propos</Link>
            <span className="text-neutral-600">/</span>

            <Link href="/contact" className="hover:text-neutral-200">Contact</Link>
            <span className="text-neutral-600">/</span>

            <Link href="/privacy" className="hover:text-neutral-200">Confidentialité</Link>
            <span className="text-neutral-600">/</span>

            <Link href="/legal" className="hover:text-neutral-200">Mentions légales</Link>
          </nav>

          {/* SOCIAL ICONS */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <Link href="https://www.instagram.com/retro.goy/" className="hover:text-neutral-200" target="_blank">
              <Instagram size={16} />
            </Link>
            <Link href="https://www.youtube.com/@retrogoy" className="hover:text-neutral-200" target="_blank">
              <Youtube size={16} />
            </Link>
            <Link href="https://github.com/RetroGoy" className="hover:text-neutral-200" target="_blank">
              <Github size={16} />
            </Link>
            <Link href="https://dumatus.fr" className="hover:text-green-700" target="_blank">
              <ExternalLink size={16} />
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}