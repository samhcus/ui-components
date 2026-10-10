"use client";

import { cn } from "@/lib/utils";

/**
 * HueSlider — a range input whose track IS the colour wheel, with a live swatch
 * that glows in the picked hue. Controlled: pass a hue (0–359) and an onChange.
 * Zero dependencies, styled for WebKit and Firefox, and legible in light and
 * dark. Pair it with `hsl(${hue} …)` anywhere you want a one-thumb colour pick.
 */
export function HueSlider({
  value,
  onChange,
  saturation = 90,
  lightness = 55,
  showSwatch = true,
  className,
  "aria-label": ariaLabel = "Hue",
}: {
  /** Current hue, 0–359. */
  value: number;
  onChange: (hue: number) => void;
  /** Saturation/lightness used only for the swatch preview. */
  saturation?: number;
  lightness?: number;
  showSwatch?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const color = `hsl(${value} ${saturation}% ${lightness}%)`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showSwatch && (
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 rounded-[6px] ring-2 ring-black/15 dark:ring-white/40"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
      <input
        type="range"
        min={0}
        max={359}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-4 w-full cursor-pointer appearance-none rounded-md bg-transparent",
          "[&::-webkit-slider-runnable-track]:h-[16px] [&::-webkit-slider-runnable-track]:rounded-md [&::-webkit-slider-runnable-track]:[background:linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]",
          "[&::-webkit-slider-thumb]:mt-[2px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[5px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.25),0_1px_4px_rgba(0,0,0,0.4)]",
          "[&::-moz-range-track]:h-[16px] [&::-moz-range-track]:rounded-md [&::-moz-range-track]:[background:linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]",
          "[&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:w-[12px] [&::-moz-range-thumb]:rounded-[5px] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white",
        )}
      />
    </div>
  );
}
