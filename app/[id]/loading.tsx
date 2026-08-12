import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background bg-dot-pattern">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin text-yellow-400" size={32} />
        <span className="text-sm">Chargement du graphe…</span>
      </div>
    </div>
  );
}
