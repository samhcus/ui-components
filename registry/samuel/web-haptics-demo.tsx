"use client";

import { useRef, useState } from "react";
import { playSound, SOUND_PACK } from "./ui-sound";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

/** The whole pack, playable — tap any nub to hear it. Weight-laddered. */
export function WebHapticsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SOUND_PACK.map((s) => (
        <button
          key={s.name}
          type="button"
          onClick={() => playSound(s.name)}
          aria-label={`Play ${s.label} haptic`}
          className={cn(
            "flex flex-col items-start gap-0.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left outline-none transition-[transform,background-color,border-color] duration-150 active:scale-[0.97]",
            EASE,
            "[@media(hover:hover)]:hover:border-foreground/25 [@media(hover:hover)]:hover:bg-muted/50",
          )}
        >
          <span className="text-[14px] font-medium leading-none text-foreground">{s.label}</span>
          <span className="text-[11px] leading-none text-muted-foreground">{s.weight}</span>
        </button>
      ))}
    </div>
  );
}

/** Live UI to feel the pack in context: a toggle, a slider, a confirm, a notify. */
export function WebHapticsPlayground() {
  const [on, setOn] = useState(false);
  const [val, setVal] = useState(0.5);
  const [pinged, setPinged] = useState(false);
  const pingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTick = useRef(0.5);

  // The detent only ticks once the value has actually travelled: holding the
  // pointer past either end pins the value, so the cue stays silent there instead
  // of looping every pointermove.
  const dragSlider = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const raw = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setVal(raw);
    if (Math.abs(raw - lastTick.current) >= 0.045) {
      lastTick.current = raw;
      playSound("haptic");
    }
  };

  const ring = () => {
    playSound("ding");
    setPinged(true);
    if (pingTimer.current) clearTimeout(pingTimer.current);
    pingTimer.current = setTimeout(() => setPinged(false), 2600);
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      {/* Toggle — on/off cue */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-foreground">Toggle</span>
        <button
          type="button"
          onClick={() => { const n = !on; playSound(n ? "on" : "off"); setOn(n); }}
          aria-pressed={on}
          aria-label="Toggle"
          className={cn("relative h-6 w-11 rounded-[8px] outline-none transition-colors duration-200", EASE, on ? "bg-foreground" : "bg-muted")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-[6px] bg-background shadow-sm transition-transform duration-200", EASE, on ? "translate-x-[22px]" : "translate-x-0.5")} />
        </button>
      </div>

      {/* Slider — haptic detent per step */}
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-[14px] text-foreground">Slider</span>
        <div
          onPointerDown={dragSlider}
          onPointerMove={(e) => e.buttons === 1 && dragSlider(e)}
          aria-label="Slider"
          className="relative h-4 flex-1 cursor-pointer touch-none rounded-md bg-muted"
        >
          <div className="absolute inset-y-0 left-0 rounded-md bg-foreground" style={{ width: `${val * 100}%` }} />
          <span className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-background bg-foreground shadow-[0_1px_4px_rgba(0,0,0,0.35)]" style={{ left: `${val * 100}%` }} />
        </div>
      </div>

      {/* Actions: success + the notification bell */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => playSound("success")}
          className={cn("flex-1 rounded-xl bg-foreground py-2.5 text-[14px] font-medium text-background outline-none transition-transform duration-150 active:scale-[0.97]", EASE)}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={ring}
          aria-live="polite"
          className={cn("flex-1 rounded-xl border border-border py-2.5 text-[14px] font-medium text-foreground outline-none transition-[transform,background-color] duration-150 active:scale-[0.97] [@media(hover:hover)]:hover:bg-muted/50", EASE)}
        >
          {pinged ? "Bell rung" : "Notify me"}
        </button>
      </div>
    </div>
  );
}
