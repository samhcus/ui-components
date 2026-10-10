"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
  animate,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * SpotlightCard — a premium card whose border and surface light up with a
 * radial spotlight that tracks the cursor. The border glow is spring-smoothed
 * so it feels like it has weight; the surface glow is crisp and instant.
 * Dark-friendly, degrades gracefully with prefers-reduced-motion, and works
 * sitting alone on a gallery card.
 */
export function SpotlightCard({
  className,
  accent = "#7c6cff",
  eyebrow = "Component",
  title = "Spotlight Card",
  description = "A surface that catches the light. Move your cursor across it and the border follows with a little weight.",
  ctaLabel = "View source",
  onCtaClick,
}: {
  className?: string;
  accent?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  // Raw pointer position (crisp surface glow tracks this exactly).
  const mx = useMotionValue(-9999);
  const my = useMotionValue(-9999);

  // Spring-smoothed position for the border light so it lags with weight.
  const spring = { stiffness: 220, damping: 26, mass: 0.6 };
  const bx = useSpring(mx, reduce ? { stiffness: 1000, damping: 100 } : spring);
  const by = useSpring(my, reduce ? { stiffness: 1000, damping: 100 } : spring);

  // Presence of the light (0 → 1 on enter/leave), animated smoothly.
  const glow = useMotionValue(0);

  const surface = useMotionTemplate`radial-gradient(230px circle at ${mx}px ${my}px, ${accent}2e, transparent 68%)`;
  const border = useMotionTemplate`radial-gradient(170px circle at ${bx}px ${by}px, ${accent}, transparent 62%)`;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  function fade(to: number) {
    animate(glow, to, { duration: 0.35, ease: [0.16, 1, 0.3, 1] });
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={() => fade(1)}
      onPointerLeave={() => {
        fade(0);
        mx.set(-9999);
        my.set(-9999);
      }}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative w-full max-w-sm overflow-hidden rounded-2xl",
        "border border-border bg-card",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_30px_-12px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* Border light — a gradient ring revealed only on the 1px edge via mask. */}
      <motion.div
        aria-hidden
        style={{
          opacity: glow,
          background: border,
          padding: 1,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
      />

      {/* Surface spotlight — soft radial wash tinted by the accent. */}
      <motion.div
        aria-hidden
        style={{ opacity: glow, background: surface }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
      />

      {/* Fine top highlight for that lit-glass feel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
      />

      <div className="relative flex flex-col gap-4 p-6">
        {eyebrow && (
          <div className="flex items-center gap-2.5">
            <span
              className="relative flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: `linear-gradient(150deg, ${accent}26, transparent)`,
                boxShadow: `inset 0 0 0 1px ${accent}33`,
              }}
            >
              <span className="h-2 w-2 rounded-[3px]" style={{ background: accent }} />
            </span>
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              {eyebrow}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {ctaLabel && (
          <button
            type="button"
            onClick={onCtaClick}
            className={cn(
              "group/cta mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg",
              "px-3 py-1.5 text-sm font-medium text-foreground",
              "border border-border bg-background/60 backdrop-blur",
              "outline-none transition-[transform,border-color] duration-200 ease-out",
              "hover:-translate-y-px active:translate-y-0",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            style={{ ["--tw-ring-color" as string]: accent }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accent}66`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
