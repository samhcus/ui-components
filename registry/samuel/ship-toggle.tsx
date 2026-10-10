"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 480, damping: 34 } as const;

/**
 * Ship Toggle — a tactile two-state switch (draft ⇄ shipped). The knob slides
 * between halves with a spring via a shared layoutId. Semantically a switch.
 */
export function ShipToggle({
  checked,
  onCheckedChange,
  labels = { on: "Shipped", off: "Draft" },
  className,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  labels?: { on: string; off: string };
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative grid h-9 w-[136px] grid-cols-2 gap-1 rounded-2xl border border-border bg-muted p-1",
        className
      )}
    >
      <span className="relative flex items-center justify-center rounded-full">
        {!checked && (
          <motion.span
            layoutId="ship-toggle-knob"
            transition={SPRING}
            className="absolute inset-0 rounded-xl bg-background shadow-sm"
          />
        )}
        <span
          className={cn(
            "relative z-10 text-[12px] font-medium transition-colors duration-200",
            !checked ? "text-foreground" : "text-muted-foreground/50"
          )}
        >
          {labels.off}
        </span>
      </span>

      <span className="relative flex items-center justify-center rounded-full">
        {checked && (
          <motion.span
            layoutId="ship-toggle-knob"
            transition={SPRING}
            className="absolute inset-0 rounded-xl bg-primary shadow-sm"
          />
        )}
        <span
          className={cn(
            "relative z-10 text-[12px] font-medium transition-colors duration-200",
            checked ? "text-primary-foreground" : "text-muted-foreground/50"
          )}
        >
          {labels.on}
        </span>
      </span>
    </button>
  );
}
