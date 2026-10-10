"use client";

import * as React from "react";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CoffeeButton — a frosted-glass "buy me a coffee" pill built to sit over
 * imagery or a dark scene. White text on a translucent, blurred surface, with a
 * gentle press. Put it over a photo or gradient so the glass has something to
 * catch.
 */
export function CoffeeButton({
  label = "Buy me a coffee",
  href = "#",
  target = "_blank",
  className,
}: {
  /** Button text. */
  label?: string;
  /** Where it links. */
  href?: string;
  /** Anchor target. Defaults to a new tab. */
  target?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12.5px] font-medium text-white backdrop-blur-md transition-[transform,background-color] duration-150 ease-out [@media(hover:hover)]:hover:bg-white/20 active:scale-[0.96]",
        className,
      )}
    >
      <Coffee size={14} />
      {label}
    </a>
  );
}

export default CoffeeButton;
