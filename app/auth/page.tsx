"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/");
  const [formData, setFormData]   = useState({ email: "", password: "" });
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* 1️⃣ lire ?redirectTo=… */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get("redirectTo") || "/");
  }, []);

  /* 2️⃣ notifier + rediriger */
  const notifyAndRedirect = useCallback(
    (message: string, dest = redirectTo) => {
      toast.success(message);
      setTimeout(() => router.push(dest), 100); // petit délai pour laisser apparaître le toast
    },
    [redirectTo, router]
  );

  /* 3️⃣ si déjà logué, hop */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) notifyAndRedirect("Vous êtes déjà connecté ✅");
    });
  }, [notifyAndRedirect]);

  /* ---------- handlers ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword(formData);
    if (error) {
      setError(error.message);
    } else {
      notifyAndRedirect("Connexion réussie 🚀");
    }
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp(formData);
    if (error) {
      setError(error.message);
    } else {
      toast("Vérifie tes mails pour confirmer ton compte", { icon: "📧" });
    }
    setIsLoading(false);
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* … le reste de ton formulaire, inchangé … */}
    </div>
  );
}
