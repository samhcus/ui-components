"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Magnetic Button — the wrapped element is gently pulled toward the pointer
 * while hovered and springs back to rest on leave. Mouse-driven movement, so a
 * spring, never a duration curve. Respects prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  /** 0–1, how far the element follows the pointer offset */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 16, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 180, damping: 16, mass: 0.2 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn("inline-flex w-fit", className)}
    >
      {children}
    </motion.div>
  );
}
