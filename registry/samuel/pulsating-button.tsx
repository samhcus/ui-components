"use client";

import React, { useImperativeHandle, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ring color. Defaults to the button's own background color. */
  pulseColor?: string;
  /** One pulse cycle, e.g. "1.5s". */
  duration?: string;
  /** How far the ring expands, e.g. "8px". */
  distance?: string;
  variant?: "pulse" | "ripple";
}

/**
 * Pulsating Button — a button that emits an expanding ring. The ring color
 * tracks the button's own background unless `pulseColor` is set. Ships its own
 * keyframes (samuel-pulse / samuel-pulse-ripple) so it never collides with
 * Tailwind's built-in animate-pulse.
 */
export const PulsatingButton = React.forwardRef<
  HTMLButtonElement,
  PulsatingButtonProps
>(
  (
    {
      className,
      children,
      pulseColor,
      duration = "1.5s",
      distance = "8px",
      variant = "pulse",
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLButtonElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    useLayoutEffect(() => {
      const button = innerRef.current;
      if (!button) return;

      if (pulseColor) {
        button.style.removeProperty("--samuel-bg");
        return;
      }

      let animationFrameId = 0;
      let currentBg = "";

      const updateBg = () => {
        animationFrameId = 0;
        const nextBg = getComputedStyle(button).backgroundColor;
        if (nextBg === currentBg) return;
        currentBg = nextBg;
        button.style.setProperty("--samuel-bg", nextBg);
      };

      const scheduleBgUpdate = () => {
        if (animationFrameId) return;
        animationFrameId = window.requestAnimationFrame(updateBg);
      };

      updateBg();

      const themeObserver = new MutationObserver(scheduleBgUpdate);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const buttonObserver = new MutationObserver(scheduleBgUpdate);
      buttonObserver.observe(button, { attributes: true });

      const syncEvents = ["blur", "focus", "pointerenter", "pointerleave"] as const;
      for (const eventName of syncEvents) {
        button.addEventListener(eventName, scheduleBgUpdate);
      }

      return () => {
        if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        themeObserver.disconnect();
        buttonObserver.disconnect();
        for (const eventName of syncEvents) {
          button.removeEventListener(eventName, scheduleBgUpdate);
        }
      };
    }, [pulseColor]);

    return (
      <button
        ref={innerRef}
        className={cn(
          "bg-primary text-primary-foreground relative flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-center",
          className
        )}
        style={
          {
            ...(pulseColor && { "--pulse-color": pulseColor }),
            "--duration": duration,
            "--distance": distance,
          } as React.CSSProperties
        }
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] bg-inherit",
            variant === "pulse"
              ? "animate-[samuel-pulse_var(--duration,1.5s)_ease-out_infinite]"
              : "animate-[samuel-pulse-ripple_var(--duration,1.5s)_cubic-bezier(0.16,1,0.3,1)_infinite]"
          )}
        />
      </button>
    );
  }
);

PulsatingButton.displayName = "PulsatingButton";
