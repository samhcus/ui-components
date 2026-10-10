"use client";

import { usePathname, useRouter } from "next/navigation";
import { useScrollHost } from "@/hooks/useScrollHost";
import { OverlayControl } from "@/components/post-overlay-shell";

/**
 * The standalone Back / Close / Home pill, top-centred over the viewport. Kept OUT
 * of the dynamic toolbar on purpose: navigation controls read as separate labeled
 * pills, not glyphs inside the island.
 *
 * - An open post overlay carries `data-overlay="back"|"close"` on its scroll surface
 *   (surfaced by `useScrollHost`); we show the matching pill and dispatch Escape,
 *   reusing each section's own close handler.
 * - On any route away from home (/components, /sandbox, …) we show a Home pill that
 *   returns to the home page. Overlays keep the pathname at "/", so the two never
 *   collide.
 */
export function OverlayControls() {
  const host = useScrollHost();
  const overlayNav = (host?.dataset.overlay as "back" | "close" | undefined) || null;
  const pathname = usePathname();
  const router = useRouter();

  if (overlayNav) {
    return (
      <OverlayControl
        variant={overlayNav}
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))}
      />
    );
  }
  if (pathname !== "/") {
    return <OverlayControl variant="home" onClick={() => router.push("/")} />;
  }
  return null;
}
