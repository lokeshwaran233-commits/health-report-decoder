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
    // Lock body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        className="relative w-full max-w-md my-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-muted hover:text-brand-dark hover:bg-brand-surface border border-brand-border shadow-sm"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <AuthForm initialTab={initialTab} onSuccess={onClose} />
        </div>
      </motion.div>
    </div>
  );
}

export default AuthModal;
