import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  stagger?: boolean;
}

export function ScrollReveal({
  children,
  delay = 0,
  className,
  stagger = false,
}: ScrollRevealProps) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduce ? 0 : 0.4,
        delay,
        staggerChildren: stagger ? 0.08 : 0,
      },
    },
  };
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
