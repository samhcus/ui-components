"use client";

import { useEffect } from "react";

/**
 * The mobile scale is a FIXED 390px canvas (the smallest phone size). Screens
 * narrower than 390px can't fit it, so instead of squeezing or reflowing we zoom
 * the whole canvas down uniformly to fit — like page zoom, nothing re-stacks.
 *
 * This sets `--mobile-zoom` to viewport/390 below 390px (and 1 otherwise); the
 * body reads it via `zoom: var(--mobile-zoom)` inside the mobile media query.
 * Above 768px the desktop composition takes over and this value is ignored.
 */
const MOBILE_CANVAS = 390;

export function MobileScale() {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      // On narrow phones innerWidth can expand to the unscaled 390px body.
      // Measure the root viewport so that overflow cannot prevent scaling down.
      const w = document.documentElement.clientWidth;
      const zoom = w < MOBILE_CANVAS ? w / MOBILE_CANVAS : 1;
      root.style.setProperty("--mobile-zoom", String(zoom));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return null;
}
