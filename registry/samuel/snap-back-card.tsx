"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * SnapBackCard — wrap anything to make it draggable anywhere on the page, then
 * spring back to exactly where it started when you let go. Uses Motion's
 * `dragSnapToOrigin`, lifts and slightly scales the content while held, and
 * rides a spring home on release. Set `disabled` to lock it in place. Drag is
 * disabled under prefers-reduced-motion (the element stays put).
 */
export function SnapBackCard({
  children,
  disabled = false,
  className,
  onDragStart,
  onDragEnd,
}: {
  children: React.ReactNode;
  /** Lock the card in place (no dragging). */
  disabled?: boolean;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const reduce = useReducedMotion();
  const [dragging, setDragging] = useState(false);
  const canDrag = !disabled && !reduce;

  return (
    <motion.div
      drag={canDrag}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.16}
      onDragStart={() => {
        setDragging(true);
        onDragStart?.();
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd?.();
      }}
      animate={{
        scale: dragging ? 1.04 : 1,
        boxShadow: dragging
          ? "0 30px 60px -18px rgba(0,0,0,0.35)"
          : "0 0px 0px 0px rgba(0,0,0,0)",
      }}
      transition={{ type: "spring", stiffness: 480, damping: 34 }}
      className={cn(
        canDrag && "cursor-grab active:cursor-grabbing",
        dragging && "relative z-50",
        className,
      )}
      style={{ touchAction: canDrag ? "none" : undefined }}
    >
      {children}
    </motion.div>
  );
}
