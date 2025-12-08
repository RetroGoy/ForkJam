// components/Footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black/80 text-neutral-400 text-xs">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono">
          ForkJam.app — experimental collaborative music graph.
        </p>
        <nav className="flex flex-wrap items-center gap-3">
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
    </footer>
  );
}