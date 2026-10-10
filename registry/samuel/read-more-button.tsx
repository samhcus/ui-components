"use client";

import * as React from "react";
import { Book, BookOpen } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * ReadMoreButton — a small pill link whose trailing book icon is closed at rest
 * and opens with a gentle upward lift on hover. Built to sit beside a section
 * heading as a "read more" / "see all" affordance.
 */
export function ReadMoreButton({
  label = "Read more",
  href = "#",
  className,
}: {
  /** Button text. */
  label?: string;
  /** Where it links. */
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors duration-150 hover:bg-muted/60",
        className,
      )}
    >
      {label}
      {/* Book closes at rest and opens on hover, with a small lift */}
      <span className="relative inline-block h-[14px] w-[14px]">
        <Book
          size={14}
          weight="bold"
          className="absolute inset-0 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-0"
        />
        <BookOpen
          size={14}
          weight="fill"
          className="absolute inset-0 text-foreground opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100"
        />
      </span>
    </a>
  );
}

export default ReadMoreButton;
