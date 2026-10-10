"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hover-to-focus for a feed row, built so the focus (and the site-wide scrim it
 * drives) can never get stuck.
 *
 * The naive version — set focus on a row's `onMouseEnter`, clear on its
 * `onMouseLeave` — breaks two ways:
 *   • Touch: a tap fires a synthetic `mouseenter` but never a `mouseleave`, so
 *     the scrim latches on and there's nothing to clear it. Gating to fine
 *     pointers means touch never focuses at all.
 *   • Desktop: `mouseleave` is unreliable (fast exits, a reflow from the scrim
 *     mounting, the window losing focus), leaving the scrim up with no way out.
 *
 * So: `focus(id)` only takes on a hover-capable pointer, and `clear()` is wired
 * to the list container's leave AND to scroll / blur / tab-hide as safety nets.
 */
export function useHoverFocus() {
  const [focused, setFocused] = useState<string | null>(null);
  const hoverable = useRef(false);

  useEffect(() => {
    hoverable.current =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const clear = useCallback(() => setFocused(null), []);
  const focus = useCallback((id: string) => {
    if (hoverable.current) setFocused(id);
  }, []);

  // Safety net: once something is focused, anything that means "the pointer is no
  // longer meaningfully on a row" wipes it — scrolling away, the tab losing
  // focus, the window blurring. Belt-and-suspenders around the container leave.
  useEffect(() => {
    if (focused === null) return;
    window.addEventListener("scroll", clear, { passive: true });
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("scroll", clear);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [focused, clear]);

  return { focused, focus, clear };
}
