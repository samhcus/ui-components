"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Toolbar } from "@/components/toolbar";
import { MobileScale } from "@/components/mobile-scale";
import { LoadingScreen } from "@/components/loading-screen";
import { OverlayControls } from "@/components/overlay-controls";

/** Route-tree segments also work when the library root is rewritten by host. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const library = segment === "library" || segment === "components" || segment === "examples";
  return <>
    {!library && <><MobileScale /><Toolbar /><OverlayControls /></>}
    <div id="mh-page">{children}</div>
    {!library && <LoadingScreen />}
  </>;
}
