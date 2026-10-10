"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tilt Card — a 3D card that leans toward the pointer with real perspective, a
 * soft glare highlight that tracks the cursor, and its content floating on a
 * higher plane for parallax depth. Springs back to flat on leave. Pointer-driven,
 * so every physical motion is a spring, never a duration curve. The card is a
 * real, focusable button; motion is disabled under prefers-reduced-motion.
 */
export function TiltCard({
  children,
  accent = "#7c6cff",
  /** Max tilt in degrees at the card's edges. */
  maxTilt = 14,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  accent?: string;
  maxTilt?: number;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  // Pointer position, normalized to -0.5..0.5 across the card.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 170, damping: 18, mass: 0.4 };
  const rotateX = useSpring(useTransform(py, (v) => -v * maxTilt), spring);
  const rotateY = useSpring(useTransform(px, (v) => v * maxTilt), spring);

  // Glare follows the pointer; opacity springs in on hover.
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 26 });
  const gx = useTransform(px, (v) => `${(v + 0.5) * 100}%`);
  const gy = useTransform(py, (v) => `${(v + 0.5) * 100}%`);
  const glare = useMotionTemplate`radial-gradient(120px 120px at ${gx} ${gy}, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)`;

  // Content sits on a plane above the card for parallax.
  const liftX = useSpring(useTransform(px, (v) => v * 18), spring);
  const liftY = useSpring(useTransform(py, (v) => v * 18), spring);

  function handleMove(e: React.PointerEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function handleEnter() {
    if (reduce) return;
    glareOpacity.set(1);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
    glareOpacity.set(0);
  }

  return (
    <div style={{ perspective: 900 }} className={cn("inline-block", className)}>
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        onPointerMove={handleMove}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onBlur={handleLeave}
        style={
          {
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            "--tw-ring-color": accent,
          } as React.CSSProperties
        }
        whileTap={reduce ? undefined : { scale: 0.985 }}
        className={cn(
          "group relative block h-44 w-64 select-none overflow-hidden rounded-3xl text-left",
          "border border-border bg-card",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-16px_rgba(0,0,0,0.35)]",
          "outline-none transition-shadow duration-300",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {/* accent wash, anchored to the top-left corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(130% 120% at 0% 0%, ${accent}2e, transparent 55%)`,
          }}
        />

        {/* hairline top edge to catch the light */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }}
        />

        {/* floating content plane */}
        <motion.div
          style={{ x: liftX, y: liftY, transformStyle: "preserve-3d" }}
          className="relative flex h-full flex-col justify-between p-5"
        >
          <div
            aria-hidden
            style={{ transform: "translateZ(48px)" }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/70 backdrop-blur-sm"
          >
            <motion.span style={{ color: accent }}>
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </motion.span>
          </div>

          {children ?? (
            <div style={{ transform: "translateZ(30px)" }}>
              <p className="text-base font-semibold tracking-tight text-foreground">
                Tilt Card
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Follows your cursor in 3D.
              </p>
            </div>
          )}
        </motion.div>

        {/* moving glare — sits above content so it reads as a real reflection */}
        <motion.div
          aria-hidden
          style={{ backgroundImage: glare, opacity: glareOpacity, transform: "translateZ(60px)" }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        {/* crisp inner ring for a glassy edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10"
        />
      </motion.button>
    </div>
  );
}
