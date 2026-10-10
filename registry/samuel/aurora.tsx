"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Aurora — soft, slow-drifting ribbons of colour that glow behind content like
 * the northern lights. Drop it into any `relative` box as a layer: a few large
 * blurred blobs screen-blend and wander on their own timers, so it never loops
 * visibly. GPU-cheap (transform + opacity only). Holds still, still glowing,
 * under prefers-reduced-motion.
 */
export function Aurora({
  colors = ["#7c6cff", "#22d3ee", "#f472b6"],
  speed = 1,
  blur = 40,
  className,
}: {
  /** Two-plus colours for the ribbons. */
  colors?: string[];
  /** Drift-speed multiplier. */
  speed?: number;
  /** Blur radius in px — higher is dreamier. */
  blur?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const spots = [
    { left: "8%", top: "6%", x: ["-12%", "18%", "-12%"], y: ["-8%", "16%", "-8%"] },
    { left: "44%", top: "28%", x: ["14%", "-16%", "14%"], y: ["10%", "-12%", "10%"] },
    { left: "62%", top: "10%", x: ["-8%", "12%", "-8%"], y: ["-6%", "18%", "-6%"] },
    { left: "24%", top: "40%", x: ["10%", "-14%", "10%"], y: ["8%", "-10%", "8%"] },
  ];

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {colors.map((c, i) => {
        const s = spots[i % spots.length];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: s.left,
              top: s.top,
              width: "72%",
              height: "72%",
              background: c,
              opacity: 0.5,
              filter: `blur(${blur}px)`,
              mixBlendMode: "screen",
            }}
            animate={reduce ? undefined : { x: s.x, y: s.y, scale: [1, 1.25, 1] }}
            transition={{ duration: (11 + i * 2.5) / speed, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
