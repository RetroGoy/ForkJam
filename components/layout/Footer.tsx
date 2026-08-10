import Link from "next/link";
import { Instagram, Youtube, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 text-xs text-white/50 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="no-scrollbar flex w-full items-center gap-10 overflow-x-auto sm:overflow-visible">
          <p className="flex-shrink-0 font-mono">
            © 2025 ForkJam <span className="text-white/30">| by</span> Nathanaël Von Eggis
          </p>

          <nav className="flex flex-shrink-0 items-center gap-3">
            <Link href="/what-is-forkjam" className="transition hover:text-white/90">
              What is ForkJam
            </Link>
            <span className="text-white/25">/</span>
            <Link href="/about" className="transition hover:text-white/90">
              À propos
            </Link>
            <span className="text-white/25">/</span>
            <Link href="/contact" className="transition hover:text-white/90">
              Contact
            </Link>
            <span className="text-white/25">/</span>
            <Link href="/privacy" className="transition hover:text-white/90">
              Confidentialité
            </Link>
            <span className="text-white/25">/</span>
            <Link href="/legal" className="transition hover:text-white/90">
              Mentions légales
            </Link>
          </nav>

          <div className="flex flex-shrink-0 items-center gap-5">
            <Link
              href="https://www.instagram.com/retro.goy/"
              target="_blank"
              className="transition hover:text-yellow-300"
            >
              <Instagram size={16} />
            </Link>
            <Link
              href="https://www.youtube.com/@retrogoy"
              target="_blank"
              className="transition hover:text-yellow-300"
            >
              <Youtube size={16} />
            </Link>
            <Link
              href="https://github.com/RetroGoy"
              target="_blank"
              className="transition hover:text-yellow-300"
            >
              <Github size={16} />
            </Link>
            <Link
              href="https://dumatus.fr"
              target="_blank"
              className="transition hover:text-yellow-300"
            >
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
