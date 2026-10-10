"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pill Toggle — a two-position rocker for light/dark mode.
 * The active half sinks in with an inset shadow, like a physical switch.
 *
 * Uncontrolled (no props) drives the real site theme via next-themes. Pass
 * `checked` + `onCheckedChange` to run it as an isolated controlled switch
 * (`checked` = dark) instead — e.g. a gallery preview that must not flip the
 * whole site's theme.
 */
export function PillToggle({
  checked,
  onCheckedChange,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isControlled = checked !== undefined;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isLight = isControlled ? !checked : !mounted || resolvedTheme === "light";

  const toggle = () => {
    if (isControlled) {
      onCheckedChange?.(!checked);
    } else {
      setTheme(isLight ? "dark" : "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="relative flex h-[60px] w-10 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform duration-150 active:scale-[0.96]"
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span
        className={cn(
          "flex flex-1 items-center justify-center transition-[background-color,box-shadow] duration-200",
          isLight
            ? "bg-primary/10 shadow-[inset_0_3px_6px_rgba(0,0,0,0.12)]"
            : "bg-transparent"
        )}
      >
        <Sun
          size={13}
          strokeWidth={2.5}
          className={isLight ? "text-primary" : "text-muted-foreground/25"}
        />
      </span>
      <span className="h-px shrink-0 bg-border" />
      <span
        className={cn(
          "flex flex-1 items-center justify-center transition-[background-color,box-shadow] duration-200",
          !isLight
            ? "bg-foreground/[0.08] shadow-[inset_0_3px_6px_rgba(0,0,0,0.18)]"
            : "bg-transparent"
        )}
      >
        <Moon
          size={13}
          strokeWidth={2.5}
          className={!isLight ? "text-foreground" : "text-muted-foreground/25"}
        />
      </span>
    </button>
  );
}
