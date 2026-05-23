import type { ReactNode } from "react";
import { motion } from "framer-motion";

export interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="min-h-dvh bg-brand-surface pt-14"
    >
      {children}
    </motion.div>
  );
}
