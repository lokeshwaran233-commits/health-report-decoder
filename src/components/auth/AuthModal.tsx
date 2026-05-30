import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
}

export function AuthModal({ open, onClose, initialTab = "signin" }: AuthModalProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        className="w-full max-w-md rounded-card bg-white p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 text-brand-muted hover:text-brand-dark"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <AuthForm initialTab={initialTab} onSuccess={onClose} />
      </motion.div>
    </div>
  );
}

export default AuthModal;
