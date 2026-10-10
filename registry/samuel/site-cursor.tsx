"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  type SpringOptions,
  type Transition,
  type Variant,
} from "motion/react";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SiteCursor — a custom follower cursor: a soft pill that tracks the real
 * pointer and expands into a "More +" label whenever it drifts over an
 * interactive element (links, buttons, `role="button"`, `tabindex="0"`, or
 * anything with `cursor: pointer`).
 *
 * Self-contained: the underlying cursor-follower primitive is inlined here
 * (no separate `motion-primitives/cursor` import needed). All `window`/
 * `document` access is confined to `useEffect`, so it is SSR-safe, and every
 * global side effect (the mousemove listener, hiding the native cursor) is
 * torn down on unmount.
 */

type CursorProps = {
  children: React.ReactNode;
  className?: string;
  springConfig?: SpringOptions;
  attachToParent?: boolean;
  transition?: Transition;
  variants?: {
    initial: Variant;
    animate: Variant;
    exit: Variant;
  };
  onPositionChange?: (x: number, y: number) => void;
};

function Cursor({
  children,
  className,
  springConfig,
  attachToParent,
  variants,
  transition,
  onPositionChange,
}: CursorProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!attachToParent);

  // Center the follower before the first pointer move so it doesn't flash
  // in from the top-left corner. Runs client-only via useEffect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    cursorX.set(window.innerWidth / 2);
    cursorY.set(window.innerHeight / 2);
  }, [cursorX, cursorY]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousCursor = document.body.style.cursor;
    if (!attachToParent) {
      document.body.style.cursor = "none";
    }

    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      onPositionChange?.(e.clientX, e.clientY);
    };
    document.addEventListener("mousemove", updatePosition);

    return () => {
      document.removeEventListener("mousemove", updatePosition);
      document.body.style.cursor = previousCursor;
    };
  }, [attachToParent, cursorX, cursorY, onPositionChange]);

  const cursorXSpring = useSpring(cursorX, springConfig ?? { duration: 0 });
  const cursorYSpring = useSpring(cursorY, springConfig ?? { duration: 0 });

  useEffect(() => {
    if (!attachToParent || !cursorRef.current) return;
    const parent = cursorRef.current.parentElement;
    if (!parent) return;

    const previousParentCursor = parent.style.cursor;

    const show = () => {
      parent.style.cursor = "none";
      setIsVisible(true);
    };
    const hide = () => {
      parent.style.cursor = "auto";
      setIsVisible(false);
    };

    parent.addEventListener("mouseenter", show);
    parent.addEventListener("mouseleave", hide);

    return () => {
      parent.removeEventListener("mouseenter", show);
      parent.removeEventListener("mouseleave", hide);
      parent.style.cursor = previousParentCursor;
    };
  }, [attachToParent]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cursorRef}
          className={cn("pointer-events-none fixed left-0 top-0 z-50", className)}
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SiteCursor({ className }: { className?: string } = {}) {
  const [isHovering, setIsHovering] = useState(false);

  const handlePositionChange = (x: number, y: number) => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const el = document.elementFromPoint(x, y);
    if (!el) {
      setIsHovering(false);
      return;
    }
    const interactive = el.closest('a, button, [role="button"], [tabindex="0"]');
    const style = window.getComputedStyle(el);
    setIsHovering(!!interactive || style.cursor === "pointer");
  };

  return (
    <Cursor
      className={className}
      springConfig={{ bounce: 0.001 }}
      variants={{
        initial: { scale: 0.3, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.3, opacity: 0 },
      }}
      transition={{ ease: "easeInOut", duration: 0.15 }}
      onPositionChange={handlePositionChange}
    >
      <motion.div
        animate={{
          width: isHovering ? 80 : 16,
          height: isHovering ? 32 : 16,
        }}
        className="flex items-center justify-center rounded-[24px] bg-gray-500/40 backdrop-blur-md dark:bg-gray-300/40"
      >
        <AnimatePresence>
          {isHovering ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="inline-flex w-full items-center justify-center"
            >
              <div className="inline-flex items-center text-sm text-white dark:text-black">
                More <PlusIcon className="ml-1 h-4 w-4" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </Cursor>
  );
}

export default SiteCursor;
