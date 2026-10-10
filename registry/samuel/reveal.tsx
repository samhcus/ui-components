"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.23, 1, 0.32, 1] as const;

type RevealProps = {
  children: React.ReactNode;
  /** Stagger index — 50ms per step. */
  index?: number;
  className?: string;
};

/**
 * The one entrance used everywhere: a short fade-up, once, on scroll.
 * Decorative motion stays consistent so the content does the talking.
 */
export function Reveal({ children, index = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
