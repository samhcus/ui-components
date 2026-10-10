"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Confetti Button — a button that fires a real physics confetti spray from the
 * exact point you clicked. Each scrap has velocity, gravity, drag and a flutter
 * flip, so it tumbles like paper instead of tweening on a rail. Runs on a
 * single canvas + rAF loop that idles to zero cost when nothing is airborne.
 * Reduced-motion users get a clean press with no spray.
 */

type Scrap = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  w: number;
  h: number;
  wob: number;
  vwob: number;
  color: string;
  round: boolean;
  born: number;
  life: number;
};

const PALETTE = [
  "#FF5C8A",
  "#FFC24B",
  "#4B9BFF",
  "#57D9A3",
  "#B980FF",
  "#FF7A5C",
];

const GRAVITY = 0.16; // px per frame², at 60fps
const DRAG = 0.986;
const OVERSPRAY = 180; // px the canvas extends past the button on each side

export function ConfettiButton({
  children = "Celebrate",
  count = 46,
  colors = PALETTE,
  className,
  onClick,
  ...props
}: Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
  /** Scraps launched per click. */
  count?: number;
  /** Confetti hues; sampled at random per scrap. */
  colors?: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrapsRef = useRef<Scrap[]>([]);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef<number>(0);
  const reduce = useReducedMotion();

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const frame = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      rafRef.current = null;
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    // dt normalized to a 60fps step, clamped so a tab-switch can't launch
    // everything into orbit on the first frame back.
    const dt = Math.min((now - prevRef.current) / 16.667, 2.4) || 1;
    prevRef.current = now;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const dragStep = Math.pow(DRAG, dt);
    const alive: Scrap[] = [];

    for (const s of scrapsRef.current) {
      s.vy += GRAVITY * dt;
      s.vx *= dragStep;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vrot * dt;
      s.wob += s.vwob * dt;

      const age = now - s.born;
      if (age > s.life || s.y > cssH + 40) continue;

      // Fade only in the final stretch; ease-out so it dissolves, not blinks.
      const fadeFrom = s.life - 420;
      const alpha = age < fadeFrom ? 1 : 1 - (age - fadeFrom) / 420;

      const flip = Math.cos(s.wob); // paper turning edge-on when near 0
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.scale(1, flip);
      ctx.fillStyle = s.color;
      if (s.round) {
        ctx.beginPath();
        ctx.arc(0, 0, s.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      }
      ctx.restore();

      alive.push(s);
    }

    scrapsRef.current = alive;

    if (alive.length > 0) {
      rafRef.current = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, cssW, cssH);
      rafRef.current = null;
    }
  }, []);

  const burst = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (reduce) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Size the backing store to the box each burst — cheap, and keeps it
      // crisp through resizes without a ResizeObserver.
      if (
        canvas.width !== Math.round(rect.width * dpr) ||
        canvas.height !== Math.round(rect.height * dpr)
      ) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const now = performance.now();

      for (let i = 0; i < count; i++) {
        // Upward-biased fan: -140°..-40° from the click point.
        const angle = (-Math.PI * 0.78) + Math.random() * (Math.PI * 0.56);
        const speed = 5 + Math.random() * 8;
        const round = Math.random() < 0.22;
        const size = 5 + Math.random() * 5;
        scrapsRef.current.push({
          x: ox + (Math.random() - 0.5) * 8,
          y: oy + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.5,
          w: round ? size + 2 : size + Math.random() * 3,
          h: round ? size + 2 : size + 5 + Math.random() * 4,
          wob: Math.random() * Math.PI * 2,
          vwob: 0.14 + Math.random() * 0.16,
          color: colors[(Math.random() * colors.length) | 0],
          round,
          born: now,
          life: 1500 + Math.random() * 900,
        });
      }

      if (rafRef.current === null) {
        prevRef.current = now;
        rafRef.current = requestAnimationFrame(frame);
      }
    },
    [colors, count, frame, onClick, reduce]
  );

  return (
    <div className="relative inline-flex isolate">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{ inset: `-${OVERSPRAY}px` }}
      />
      <motion.button
        type="button"
        onClick={burst}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        transition={{ type: "spring", stiffness: 620, damping: 24, mass: 0.6 }}
        className={cn(
          "relative z-20 inline-flex select-none items-center gap-2 rounded-xl bg-foreground px-5 py-2.5",
          "text-sm font-semibold text-background",
          "shadow-[0_1px_2px_rgba(0,0,0,0.18)] outline-none",
          "focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
        {...props}
      >
        <PartyPopper className="size-4" strokeWidth={2.25} aria-hidden />
        {children}
      </motion.button>
    </div>
  );
}
