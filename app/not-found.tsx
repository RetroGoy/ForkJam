import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background bg-dot-pattern flex flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-7xl font-extrabold tracking-widest text-yellow-400 drop-shadow-lg">
        404
      </h1>

      <h2 className="mb-2 text-2xl font-bold text-foreground">Page introuvable</h2>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Le topic que vous cherchez semble avoir disparu.
      </p>

      <Link
        href="/"
        className="rounded-full bg-yellow-400 px-6 py-3 font-bold text-black shadow-lg shadow-yellow-900/20 transition hover:bg-yellow-300"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
