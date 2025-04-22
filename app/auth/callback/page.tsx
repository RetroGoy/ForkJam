"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/profile");
      } else {
        router.push("/auth");
      }
    });
  }, []);

  return <div className="text-center p-8 text-yellow-400">Connecting...</div>;
}
