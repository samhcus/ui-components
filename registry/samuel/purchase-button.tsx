"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const CLASSES =
  "inline-flex select-none items-center gap-2 rounded-lg border border-transparent bg-[#16A34A] px-4 py-2 text-sm font-medium text-white shadow-sm outline-none transition-colors duration-150 [@media(hover:hover)]:hover:bg-[#15803D] focus-visible:ring-2 focus-visible:ring-[#16A34A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const SPRING = { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.7 };

/**
 * PurchaseButton — a confident green call to action with a cart glyph and a
 * springy press. Renders an anchor when `href` is set, a button otherwise, so
 * it drops into a product card or a plain form the same way.
 */
export function PurchaseButton({
  label = "Purchase",
  href,
  target,
  onClick,
  className,
}: {
  /** Button text. */
  label?: string;
  /** When set, renders a link to this URL. */
  href?: string;
  /** Anchor target, e.g. "_blank". */
  target?: string;
  onClick?: () => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const whileTap = reduce ? undefined : { scale: 0.97 };
  const content = (
    <>
      <ShoppingCart size={15} strokeWidth={2.5} />
      {label}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={onClick}
        whileTap={whileTap}
        transition={SPRING}
        className={cn(CLASSES, className)}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={whileTap}
      transition={SPRING}
      className={cn(CLASSES, className)}
    >
      {content}
    </motion.button>
  );
}

export default PurchaseButton;
