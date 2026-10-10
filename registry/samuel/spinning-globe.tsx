"use client";

import * as React from "react";
import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * SpinningGlobe — a clean line globe whose meridians scroll inside a circular
 * clip, so the sphere reads as rotating on its axis rather than tumbling. Spins
 * on hover by default; pass `spinning` to drive the state yourself. Stills under
 * reduced motion. Inherits color from the parent via currentColor.
 */
export function SpinningGlobe({
  size = 20,
  spinning,
  className,
}: {
  /** Pixel size of the square icon. */
  size?: number;
  /** Force the spin state. Omit to spin on hover. */
  spinning?: boolean;
  className?: string;
}) {
  const clipId = useId();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const spin = (spinning ?? hover) && !reduce;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("text-foreground", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <g
        clipPath={`url(#${clipId})`}
        stroke="currentColor"
        strokeWidth="1.05"
        opacity="0.9"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="4.6" y1="7.5" x2="19.4" y2="7.5" />
        <line x1="4.6" y1="16.5" x2="19.4" y2="16.5" />
        <motion.g
          animate={spin ? { x: [0, -8] } : { x: 0 }}
          transition={
            spin
              ? { duration: 2.2, repeat: Infinity, ease: "linear" }
              : { duration: 0.4, ease: "easeOut" }
          }
        >
          {[-4, 4, 12, 20, 28].map((cx) => (
            <ellipse key={cx} cx={cx} cy="12" rx="4" ry="9" />
          ))}
        </motion.g>
      </g>
    </svg>
  );
}

export default SpinningGlobe;
