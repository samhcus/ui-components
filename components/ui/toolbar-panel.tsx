"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Keep the shell mounted so a new target can interrupt its current motion. */
export function ToolbarPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = inner.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      data-toolbar-panel
      aria-hidden={!open}
      inert={!open}
      initial={false}
      animate={{ height: open ? height : 0, opacity: open ? 1 : 0 }}
      transition={{
        height: reduce ? { duration: 0 } : { type: "spring", duration: 0.28, bounce: 0 },
        opacity: { duration: reduce ? 0 : 0.14 },
      }}
      className="overflow-hidden"
    >
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}
