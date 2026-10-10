"use client";

import { WeatherStack } from "@/registry/samuel/weather-stack";
import { cn } from "@/lib/utils";

/**
 * WeatherScene — a looping background (gif or image) with the frosted-glass
 * WeatherStack floating over it as one joint component. A legibility scrim
 * grounds the glass over unpredictable footage. Pass your own `src`; anything
 * you drop in `children` composes on top of the scrim (captions, buttons, etc).
 */
export function WeatherScene({
  src = "/reading/reading.gif",
  alt = "Ambient looping background",
  className,
  children,
}: {
  /** Background media (gif/image) URL. */
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border sm:aspect-[16/7]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- animated gif, no next/image optimization */}
      <img src={src} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full select-none object-cover" />

      {/* Legibility scrim — grounds the glass over unpredictable footage */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/50" />

      {/* Frosted weather glass floats top-right; expanding it never reflows the scene */}
      <div className="absolute right-5 top-5 z-20 flex flex-col items-end gap-2 text-right sm:right-6 sm:top-6">
        <WeatherStack />
      </div>

      {children}
    </div>
  );
}
