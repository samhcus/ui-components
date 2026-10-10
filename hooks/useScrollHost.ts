"use client";

import { useEffect, useState } from "react";

/**
 * The element that currently owns the page's vertical scroll: the top-most open
 * full-page post overlay (`[data-overlay]`, which is `fixed inset-0 overflow-y-auto`),
 * or null when the document itself is the scroller. Lets viewport toys (the cat,
 * its poop, ink) anchor to whatever is actually scrolling, so they pin to the post
 * content instead of floating over it.
 */
export function useScrollHost() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const read = () => {
      const all = document.querySelectorAll<HTMLElement>("[data-overlay]");
      setHost(all.length ? all[all.length - 1] : null);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return host;
}
