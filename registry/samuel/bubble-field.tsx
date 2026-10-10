"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * BubbleField — a lightweight layer of bubbles that rise and wobble up through
 * a container, then loop. Drop it into any `relative` box as an ambient effect
 * (under water, behind a hero, inside a card). Each bubble gets its own size,
 * lane, drift and pace so the field never looks like a grid. Renders nothing
 * for prefers-reduced-motion.
 */
export function BubbleField({
  color = "#ffffff",
  count = 14,
  speed = 1,
  rise = 260,
  className,
}: {
  /** Bubble colour (used for the ring + a faint fill). */
  color?: string;
  /** How many bubbles are in the field. */
  count?: number;
  /** Speed multiplier — higher rises faster. */
  speed?: number;
  /** Travel distance in px (roughly the container height). */
  rise?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // The field is seeded with Math.random, so it must not render during SSR or
  // on the first client paint — that would mismatch hydration. Mount first,
  // then let the bubbles in.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 4 + Math.random() * 13,
        delay: Math.random() * 7,
        dur: (6 + Math.random() * 6) / speed,
        drift: (Math.random() - 0.5) * 36,
        opacity: 0.2 + Math.random() * 0.45,
      })),
    [count, speed],
  );

  if (reduce || !mounted) return null;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            bottom: -b.size,
            width: b.size,
            height: b.size,
            border: `1px solid ${color}`,
            background: `${color}22`,
            opacity: b.opacity,
          }}
          animate={{ y: [0, -rise], x: [0, b.drift, -b.drift * 0.6, 0] }}
          transition={{
            duration: b.dur,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
