"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ShimmerButton — a single light comet glides continuously around the border,
 * riding on a faint always-on hairline ring. On hover the face catches a diagonal
 * glint, the whole thing lifts a hair, and the arrow nudges forward; press gives a
 * springy squish. Tasteful, not gaudy: one comet, transform/opacity only, and the
 * border sweep stills itself under prefers-reduced-motion.
 *
 * Self-contained — the rotating ring is a real spinning element clipped by the
 * button, so it works on any width and needs no @keyframes or global CSS.
 */
export function ShimmerButton({
  children = "Get started",
  from = "#6366F1",
  to = "#22D3EE",
  showArrow = true,
  speed = 5,
  className = "",
  ...props
}: {
  /** Button label. */
  children?: React.ReactNode;
  /** Comet head color (leading edge). */
  from?: string;
  /** Comet tail color (trailing edge). */
  to?: string;
  /** Show the nudging arrow. */
  showArrow?: boolean;
  /** Seconds per full lap of the border comet. */
  speed?: number;
} & Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
>) {
  const reduce = useReducedMotion();

  // One clean comet; the rest of the ring is the static hairline underneath.
  const comet = `conic-gradient(from 0deg at 50% 50%,
    transparent 0deg,
    transparent 40deg,
    ${to} 90deg,
    ${from} 130deg,
    transparent 180deg,
    transparent 360deg)`;

  return (
    <motion.button
      type="button"
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.7 }}
      variants={{ rest: { scale: 1 }, hover: { scale: 1.015 } }}
      className={cn(
        "group relative isolate inline-flex cursor-pointer select-none overflow-hidden rounded-xl bg-border p-px outline-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      style={{ ["--tw-ring-color" as string]: from }}
      {...props}
    >
      {/* Rotating comet ring. Oversized + centered so it covers every corner on
          any button width; the button's overflow-hidden clips it to the pill. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-150%] z-0"
      >
        <motion.span
          className="block h-full w-full"
          style={{ background: comet }}
          animate={reduce ? { rotate: 0 } : { rotate: 360 }}
          transition={
            reduce
              ? { duration: 0 }
              : { repeat: Infinity, ease: "linear", duration: speed }
          }
        />
      </span>

      {/* The face. */}
      <span className="relative z-10 flex items-center gap-1.5 overflow-hidden rounded-xl bg-card px-5 py-2.5 text-sm font-medium text-foreground">
        {/* Diagonal glint that sweeps across on hover. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          variants={{ rest: { x: "-135%" }, hover: { x: "135%" } }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.7 }}
          style={{
            background:
              "linear-gradient(115deg, transparent 32%, color-mix(in srgb, var(--foreground) 22%, transparent) 50%, transparent 68%)",
          }}
        />
        <span className="relative">{children}</span>
        {showArrow && (
          <motion.span
            aria-hidden
            className="relative -mr-0.5 flex"
            variants={{ rest: { x: 0 }, hover: { x: 2 } }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          >
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}

export default ShimmerButton;
