"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  r: number;
}

/**
 * Rage Button — a button that snaps down on press and spits a burst of
 * particles. Ship angry. Emoji is configurable; falls back to a clean press if
 * the user prefers reduced motion.
 */
export function RageButton({
  children = "Ship it",
  emoji = "😤",
  count = 9,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  emoji?: string;
  /** Particles per press. */
  count?: number;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  const burst = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduce) {
      const next: Particle[] = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 26 + Math.random() * 36;
        return {
          id: idRef.current++,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 12,
          r: (Math.random() - 0.5) * 70,
        };
      });
      setParticles((p) => [...p, ...next]);
      const ids = new Set(next.map((n) => n.id));
      window.setTimeout(
        () => setParticles((p) => p.filter((x) => !ids.has(x.id))),
        750
      );
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={burst}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-100 active:scale-90",
        className
      )}
      {...props}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.15, rotate: p.r }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="absolute select-none text-base"
            >
              {emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </button>
  );
}
