"use client";

import * as React from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Segmented Control — an iOS-style pill switch. A single white thumb
 * spring-slides beneath the active segment (shared-layout animation), hairline
 * dividers dissolve as the thumb approaches, and pressing the live segment gives
 * a subtle physical squeeze. Transform/opacity only; honours reduced-motion.
 */
export type SegmentedControlProps = {
  /** Segment labels, left → right. 2–5 read best. */
  options?: string[];
  /** Uncontrolled starting index. */
  defaultValue?: number;
  /** Controlled selected index. */
  value?: number;
  onChange?: (index: number, label: string) => void;
  /** Accessible name for the group. */
  "aria-label"?: string;
  className?: string;
};

export function SegmentedControl({
  options = ["Day", "Week", "Month"],
  defaultValue = 0,
  value,
  onChange,
  "aria-label": ariaLabel = "View",
  className,
}: SegmentedControlProps) {
  const reduce = useReducedMotion();
  const isControlled = value != null;
  const [internal, setInternal] = React.useState(defaultValue);
  const selected = isControlled ? (value as number) : internal;

  const [hovered, setHovered] = React.useState<number | null>(null);
  const [pressed, setPressed] = React.useState<number | null>(null);

  // Scope the shared layoutId so multiple instances never trade thumbs.
  const groupId = "seg-" + React.useId().replace(/:/g, "");

  const select = (i: number) => {
    if (i === selected) return;
    if (!isControlled) setInternal(i);
    onChange?.(i, options[i]);
  };

  const spring = reduce
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const);

  return (
    <LayoutGroup id={groupId}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "relative isolate inline-flex w-full max-w-xs select-none items-stretch gap-0 rounded-[13px] p-[3px]",
          "bg-black/[0.055] ring-1 ring-inset ring-black/[0.04]",
          "dark:bg-white/[0.07] dark:ring-white/[0.06]",
          className,
        )}
      >
        {/* Hairline dividers between adjacent segments — fade near the thumb. */}
        {options.slice(1).map((_, gap) => {
          const i = gap + 1;
          const touches =
            selected === i ||
            selected === i - 1 ||
            hovered === i ||
            hovered === i - 1;
          return (
            <span
              key={"div-" + i}
              aria-hidden
              className="pointer-events-none absolute top-1/2 z-0 h-[45%] w-px -translate-y-1/2 rounded-full bg-foreground/[0.14] transition-opacity duration-200 ease-out"
              style={{
                left: `calc(3px + ${(i / options.length) * 100}% - ${(i / options.length) * 6}px)`,
                opacity: touches ? 0 : 1,
              }}
            />
          );
        })}

        {options.map((label, i) => {
          const active = selected === i;
          return (
            <button
              key={label + i}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  select((selected + 1) % options.length);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  select((selected - 1 + options.length) % options.length);
                }
              }}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() =>
                setHovered((h) => (h === i ? null : h))
              }
              onPointerDown={() => setPressed(i)}
              onPointerUp={() => setPressed(null)}
              onPointerCancel={() => setPressed(null)}
              onBlur={() => setPressed(null)}
              className={cn(
                "relative z-10 flex-1 basis-0 rounded-[10px] px-3 py-1.5 text-center text-[13px] font-medium leading-5",
                "outline-none transition-colors duration-200 ease-out",
                "focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              {active && (
                <motion.span
                  layoutId="seg-thumb"
                  aria-hidden
                  transition={spring}
                  className="absolute inset-0 -z-10 rounded-[10px] bg-white shadow-[0_1px_0.5px_rgba(0,0,0,0.04),0_2.5px_6px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-black/[0.02] dark:bg-neutral-500/90 dark:shadow-[0_2px_6px_rgba(0,0,0,0.5)] dark:ring-white/[0.06]"
                />
              )}
              {/* Press-squeeze applies to the label so the sliding thumb layout stays clean. */}
              <motion.span
                animate={{
                  scale: reduce ? 1 : pressed === i ? 0.94 : 1,
                }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 600, damping: 30 }
                }
                className="relative block"
              >
                {label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export default SegmentedControl;
