"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * WaveFill — animated "waving water" that fills a container from the bottom.
 * Drop it as a layer inside any `relative` box: the water rises to `level`
 * (0–1 of the container height) and two offset crests roll across the surface
 * at different speeds for parallax. Built from two seamlessly-tiled SVG waves
 * on a single transform loop, so it costs almost nothing. Honours
 * prefers-reduced-motion — the water still fills, the crests just hold still.
 */
export function WaveFill({
  color = "#38bdf8",
  level = 0.5,
  speed = 1,
  className,
}: {
  /** Water colour (any CSS colour). */
  color?: string;
  /** Fill height as a fraction of the container, 0–1. */
  level?: number;
  /** Crest roll-speed multiplier. */
  speed?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const height = `${Math.min(1, Math.max(0, level)) * 100}%`;

  const crests = [
    { dur: 7 / speed, opacity: 0.5, to: "-50%" },
    { dur: 11 / speed, opacity: 0.85, to: "-50%" },
  ];

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden", className)}
      style={{ height }}
    >
      {/* body of water, starting just under the crest line */}
      <div
        className="absolute inset-x-0 bottom-0 top-3"
        style={{ background: `linear-gradient(180deg, ${color}d9, ${color}80)` }}
      />
      {crests.map((c, i) => (
        <motion.div
          key={i}
          className="absolute left-0 top-0 flex h-4 w-[200%]"
          style={{ opacity: c.opacity }}
          animate={reduce ? undefined : { x: ["0%", c.to] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((k) => (
            <svg key={k} className="h-full w-1/2" viewBox="0 0 600 40" preserveAspectRatio="none">
              <path
                d="M0 22 C 100 4, 200 40, 300 22 C 400 4, 500 40, 600 22 L 600 40 L 0 40 Z"
                fill={color}
              />
            </svg>
          ))}
        </motion.div>
      ))}
    </div>
  );
}
