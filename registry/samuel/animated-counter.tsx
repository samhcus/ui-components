"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Animated Counter — an odometer that rolls to its value with real spring
 * physics. Each digit is its own wheel that always rolls *forward* the short
 * way (wrapping through 9→0), so the number rests on crisp integers instead of
 * the tilted fractions a naive continuous odometer leaves behind. Leading
 * zeros collapse to zero width and fade, new digit places bloom in as the count
 * climbs, and a soft top/bottom mask turns the row into a lit slot window.
 * Units are the softest spring so they settle last — the number "locks in"
 * left-to-right. Counts on scroll-into-view; button re-rolls to a new value.
 */

// 0-9 plus a trailing 0 so the 9→0 wrap is a seamless slide, never a jump-cut.
const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const UP = "#10b981";
const DOWN = "#f43f5e";

// Higher places are stiffer (they move little, settle first); the units wheel
// is the softest, so it keeps rolling a beat longer — a natural cascade.
function digitSpring(place: number) {
  const stiffness = 150 + place * 20;
  const damping = Math.round(2 * Math.sqrt(stiffness) * 1.22); // overdamped: no overshoot ⇒ monotonic ⇒ clean wrap
  return { stiffness, damping, mass: 1 };
}

function RollingDigit({
  digit,
  active,
  place,
  tile,
  width,
  reduce,
}: {
  digit: number;
  active: boolean;
  place: number;
  tile: number;
  width: number;
  reduce: boolean | null;
}) {
  const pos = useSpring(0, digitSpring(place));
  const target = useRef(0); // cumulative, integer, monotonically increasing
  const presence = useSpring(place === 0 ? 1 : 0, {
    stiffness: 240,
    damping: 32,
  });

  useEffect(() => {
    const cur = target.current;
    const curDigit = ((cur % 10) + 10) % 10;
    const forward = (((digit - curDigit) % 10) + 10) % 10; // always roll up
    const next = cur + forward;
    target.current = next;
    if (reduce) pos.jump(next);
    else pos.set(next);
  }, [digit, reduce, pos]);

  useEffect(() => {
    const v = active ? 1 : 0;
    if (reduce) presence.jump(v);
    else presence.set(v);
  }, [active, reduce, presence]);

  const y = useTransform(pos, (p) => -(((p % 10) + 10) % 10) * tile);
  const w = useTransform(presence, (p) => `${(p * width).toFixed(3)}em`);

  return (
    <motion.span
      aria-hidden
      className="relative block overflow-hidden"
      style={{ height: tile, width: w, opacity: presence }}
    >
      <motion.span className="absolute inset-x-0 top-0 block" style={{ y }}>
        {STRIP.map((d, i) => (
          <span
            key={i}
            className="flex items-center justify-center"
            style={{ height: tile }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

function CommaSlot({
  active,
  tile,
  width,
  reduce,
}: {
  active: boolean;
  tile: number;
  width: number;
  reduce: boolean | null;
}) {
  const presence = useSpring(0, { stiffness: 240, damping: 32 });

  useEffect(() => {
    const v = active ? 1 : 0;
    if (reduce) presence.jump(v);
    else presence.set(v);
  }, [active, reduce, presence]);

  const w = useTransform(presence, (p) => `${(p * width).toFixed(3)}em`);

  return (
    <motion.span
      aria-hidden
      className="relative flex items-center justify-center overflow-hidden text-muted-foreground"
      style={{ height: tile, width: w, opacity: presence }}
    >
      ,
    </motion.span>
  );
}

export function AnimatedCounter({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [target, setTarget] = useState(0);
  const [trend, setTrend] = useState(12.4);
  const [spins, setSpins] = useState(0);
  const started = useRef(false);

  const fontSize = 46;
  const tile = Math.round(fontSize * 1.18);
  const digitW = 0.62;
  const commaW = 0.3;

  const roll = () => {
    const v = Math.round((30000 + Math.random() * 590000) / 10) * 10;
    const t = Math.round((Math.random() * 46 - 15) * 10) / 10;
    setTarget(v);
    setTrend(t);
    setSpins((s) => s + 1);
  };

  const digits = String(target).padStart(6, "0").split("").map(Number);
  const up = trend >= 0;
  const trendColor = up ? UP : DOWN;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      onViewportEnter={() => {
        if (started.current) return;
        started.current = true;
        if (target === 0) roll();
      }}
      className={cn(
        "flex w-full select-none flex-col items-center justify-center gap-4 px-6 py-2 text-foreground",
        className,
      )}
    >
      <motion.span
        key={spins}
        initial={reduce ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
        style={{ color: trendColor, backgroundColor: `${trendColor}14` }}
      >
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {up ? "+" : "−"}
        {Math.abs(trend).toFixed(1)}%
      </motion.span>

      <div
        className="flex items-center font-semibold tracking-tight tabular-nums"
        style={{
          fontSize,
          lineHeight: 1,
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, #000 10%, #000 90%, transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent 0%, #000 10%, #000 90%, transparent 100%)",
        }}
      >
        <span
          aria-hidden
          className="mr-[0.04em] flex items-center text-muted-foreground"
          style={{ height: tile }}
        >
          $
        </span>

        {digits.map((d, i) => {
          const place = 5 - i;
          const active = place === 0 || target >= 10 ** place;
          return (
            <span key={place} className="flex">
              <RollingDigit
                digit={d}
                active={active}
                place={place}
                tile={tile}
                width={digitW}
                reduce={reduce}
              />
              {place === 3 && (
                <CommaSlot
                  active={target >= 1000}
                  tile={tile}
                  width={commaW}
                  reduce={reduce}
                />
              )}
            </span>
          );
        })}

        <span className="sr-only" aria-live="polite">
          {target.toLocaleString("en-US")} dollars
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Monthly revenue</span>
        <motion.button
          type="button"
          onClick={roll}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Generate a new value"
        >
          <motion.span
            className="flex"
            animate={{ rotate: reduce ? 0 : spins * 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          >
            <RefreshCw size={15} />
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}
