"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getRootNodes, type Node } from "@/lib/supabase/supabase";
import { PlusCircle } from "lucide-react";

export function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [topics, setTopics] = useState<Node[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUser(session?.user ?? null)
    );
  }, []);

  useEffect(() => {
    (async () => {
      const data = await getRootNodes();
      if (data) setTopics(data.slice(0, 6));
    })();
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="px-6 py-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-4">
          Bonjour {user.username}
        </h1>

        <p className="text-muted-foreground mb-8">
          Explorez les topics ou créez votre premier riff.
        </p>

        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("forkjam:open-recorder", {
                detail: { mode: "root" },
              })
            )
          }
          className="flex items-center gap-2 px-5 py-3 rounded-md bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition mb-10"
        >
          <PlusCircle size={20} />
          Créer un nouveau topic
        </button>

        <h2 className="text-xl font-bold mb-4">Topics récents</h2>

        {topics.length === 0 ? (
          <p className="text-muted-foreground">Aucun topic pour l’instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/${t.id}`}
                className="p-5 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition"
              >
                <h3 className="font-bold text-lg mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {t.description || "Explore this topic"}
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/explore"
            className="px-6 py-3 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition"
          >
            Explorer → 
          </Link>
        </div>
      </div>
    </>
  );
}