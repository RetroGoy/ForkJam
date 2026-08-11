"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { SignUpModal } from "@/components/modals/SignUpModal";
import { SignInModal } from "@/components/modals/SignInModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

type ModalType = "signin" | "signup" | "settings" | "notifications" | "forgot" | "reset" | null;

interface ModalContextValue {
  type: ModalType;
  open: (type: ModalType) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useGlobalModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useGlobalModal must be inside ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<ModalType>(null);

  const open = (t: ModalType) => setType(t);
  const close = () => setType(null);

  // fermer avec ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <ModalContext.Provider value={{ type, open, close }}>
      {children}

      {/* BACKDROP */}
      {type && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
          onClick={close}
        />
      )}

      {/* MODAL */}
      {type && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <div
              className="
                relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-xl pointer-events-auto
                animate-in fade-in-0 zoom-in-95 duration-200
              "
              onClick={(e) => e.stopPropagation()}
            >
            <button
              onClick={close}
              className="absolute right-3 top-2.5 z-10 text-black/60 transition hover:text-black"
            >
              <X size={18} />
            </button>

            {type === "signin" && <SignInModal />}
            {type === "signup" && <SignUpModal />}
            {type === "settings" && <SettingsModal />}
            {type === "notifications" && <NotificationsModal />}
            {type === "forgot" && <ForgotPasswordModal />}
            {type === "reset" && <ResetPasswordModal />}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}