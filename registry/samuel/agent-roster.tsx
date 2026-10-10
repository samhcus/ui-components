"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Gauge, Play, Pause } from "lucide-react";
import { Press_Start_2P } from "next/font/google";
import { cn } from "@/lib/utils";

// Press Start 2P is the classic blocky arcade pixel face used for the name tags.
const pixelFont = Press_Start_2P({ subsets: ["latin"], weight: "400" });

export type Agent = {
  name: string;
  gif: string;
  /** Roster color for the name tag background. */
  color: string;
  /** Readable text color on top of `color`. */
  fg: string;
  /** Transparent pixels below the character's feet in the 92px source frame.
   *  Used to sit every pal's FEET on the conveyor belt (heads stay uneven). */
  foot: number;
  /** Transparent pixels above the character's head in the 92px source frame.
   *  Used to float each name tag just above its own head. */
  head: number;
  /** Per-sprite scale tweak (1 = default). */
  scale?: number;
};

/** A small sample roster. Each `gif` has a matching `<name>-still.png` first frame
 *  shown at rest; the animated GIF only plays on hover. Swap in your own sprites. */
const DEFAULT_AGENTS: Agent[] = [
  { name: "Hank", gif: "/agents/hank.gif", color: "#FFD700", fg: "#111111", foot: 13, head: 12 },
  { name: "Nqita", gif: "/agents/nqita.gif", color: "#FF69B4", fg: "#111111", foot: 9, head: 13 },
  { name: "Cypork", gif: "/agents/cypork.gif", color: "#FFC0CB", fg: "#111111", foot: 14, head: 13 },
  { name: "Knut", gif: "/agents/knut.gif", color: "#5B8DB8", fg: "#FFFFFF", foot: 5, head: 16 },
  { name: "Yahm", gif: "/agents/yahm.gif", color: "#2D2D2D", fg: "#FFFFFF", foot: 20, head: 9 },
];

/** Progressive blur edge: stacked backdrop-blur layers, each masked a little deeper. */
function EdgeBlur({ side }: { side: "left" | "right" }) {
  const to = side === "left" ? "to right" : "to left";
  const layers = [
    { blur: 0.6, mask: `linear-gradient(${to}, black 0%, black 30%, transparent 62%)` },
    { blur: 1.6, mask: `linear-gradient(${to}, black 0%, black 12%, transparent 42%)` },
    { blur: 3, mask: `linear-gradient(${to}, black 0%, transparent 24%)` },
  ];
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 w-7",
        side === "left" ? "left-0" : "right-0"
      )}
    >
      {layers.map((l, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${l.blur}px)`,
            WebkitBackdropFilter: `blur(${l.blur}px)`,
            maskImage: l.mask,
            WebkitMaskImage: l.mask,
          }}
        />
      ))}
    </div>
  );
}

/**
 * One pal. At rest it shows a frozen first-frame still; the animated GIF only
 * plays while hovered (swapping src to the .gif restarts it from frame 0), so
 * the roster scrolls by statically until you single one out. The name tag sits
 * just above the head.
 */
const SPRITE = 128; // rendered sprite frame size (px)
const SINK = 9; // px each pal sinks INTO the belt so it reads 3D, not floating on a 2D line

function Sprite({
  agent,
  active,
  onEnter,
  onLeave,
}: {
  agent: Agent;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const still = agent.gif.replace(/\.gif$/, "-still.png");
  const scale = agent.scale ?? 1;
  // Push each sprite down by its measured foot margin so every pal's FEET land on
  // the belt (heads stay at their own heights), plus SINK so they stand IN it.
  const drop = agent.foot * (SPRITE / 92) * scale + SINK;
  // Screen Y (within the frame box) of the character's head top, after scale+drop —
  // so the name tag floats just above each pal's actual head.
  const headPx = agent.head * (SPRITE / 92);
  const headY = SPRITE - (SPRITE - headPx) * scale + drop;

  return (
    <div
      className="group/agent relative flex shrink-0 items-end"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- pixel-art frames must skip next/image re-encoding */}
      <img
        src={active ? agent.gif : still}
        alt={agent.name}
        width={SPRITE}
        height={SPRITE}
        draggable={false}
        style={{
          width: SPRITE,
          height: SPRITE,
          transform: `translateY(${drop}px) scale(${scale})`,
          transformOrigin: "bottom center",
        }}
        className="select-none [image-rendering:pixelated] transition-transform duration-200 ease-out group-hover/agent:brightness-105"
      />
      <span
        className={cn(
          pixelFont.className,
          // opt out of the font-switcher's advance-width normalisation
          "[font-size-adjust:none]",
          "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 -translate-y-full scale-90 px-1.5 py-1 text-[7px] leading-none whitespace-nowrap opacity-0 shadow-[2px_2px_0_rgba(0,0,0,0.25)] transition-[opacity,transform] duration-150 ease-out group-hover/agent:scale-100 group-hover/agent:opacity-100"
        )}
        style={{ top: headY - 4, background: agent.color, color: agent.fg }}
      >
        {agent.name}
      </span>
    </div>
  );
}

/** A pixel-art factory conveyor belt the pals ride along. Diagonal slats give it a
 *  3D angle; the parent's rAF loop translates `slatRef` by the SAME px/frame as the
 *  roster, so one slat travels at exactly the pals' on-screen velocity — feet stay
 *  planted, never skate, and there is no jump when the speed changes. Evenly spaced
 *  metallic rollers sit underneath; the parent spins them (via a `--roll` CSS var it
 *  drives in the same rAF loop) at the belt's angular velocity, so they read as real
 *  rotating cylinders rather than flat dots. */
const ROLLERS = 14;

function ConveyorBelt({
  slatRef,
  rollersRef,
}: {
  slatRef: React.RefObject<HTMLDivElement | null>;
  rollersRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[15px] [image-rendering:pixelated]">
      {/* hard pixel top edge */}
      <div className="absolute inset-x-0 top-0 z-30 h-[2px] bg-neutral-400 dark:bg-neutral-500" />
      {/* metallic rollers sit BEHIND the belt (lower z) and are nudged up so their
          top half tucks under the belt band — only the lower arc peeks out below the
          belt's bottom edge, so they read as cylinders the belt wraps over, not dots
          slapped on top. radial rim+hub shading, a spoke line and an off-center
          highlight that both orbit with `--roll` so each reads as a spinning cylinder */}
      <div ref={rollersRef} className="absolute inset-x-0 top-[6px] z-10 flex h-[7px] items-center justify-between px-2">
        {Array.from({ length: ROLLERS }).map((_, i) => (
          <span
            key={i}
            className="relative h-[7px] w-[7px] rounded-full [image-rendering:auto] will-change-transform"
            style={{
              transform: "rotate(var(--roll, 0deg))",
              background: "radial-gradient(circle at 50% 34%, #f4f4f6 0%, #c2c2c8 44%, #6d6d75 100%)",
              boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.4), 0 0.5px 0.5px rgba(0,0,0,0.35)",
            }}
          >
            {/* spoke line across the diameter */}
            <span className="absolute left-1/2 top-0 h-full w-[0.5px] -translate-x-1/2 bg-black/25" />
            {/* orbiting hub highlight */}
            <span className="absolute left-1/2 top-[0.5px] h-[1.5px] w-[1.5px] -translate-x-1/2 rounded-full bg-white/90" />
          </span>
        ))}
      </div>
      {/* belt surface: diagonal moving slats + depth shading. z-20 so it sits OVER
          the rollers, hiding their top halves and reading as a band wrapped over them */}
      <div className="absolute inset-x-0 top-[2px] z-20 h-[8px] overflow-hidden bg-neutral-300 dark:bg-neutral-700">
        <div
          ref={slatRef}
          className="absolute inset-y-0 -left-4 w-[200%] will-change-transform"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 0 38%, rgba(0,0,0,0.20) 38% 62%, transparent 62% 100%)",
            backgroundSize: "16px 100%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-black/20 dark:from-white/5 dark:to-black/35" />
        {/* soft contact shadow along the belt underside where it meets the rollers */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-t from-black/25 to-transparent dark:from-black/45" />
      </div>
    </div>
  );
}

/**
 * The roster marquee: all the pixel pals drift by side by side. The track
 * holds the roster twice, so the -50% keyframe loops seamlessly. The scroll
 * pauses ONLY while a sprite itself is hovered (empty space keeps it moving);
 * that same sprite plays its GIF and raises its tag.
 */
// Pals ride the belt at a fixed physical velocity; the slider scales it. 30 px/s at
// speed 1 matches the belt texture's original surface speed (16px / ~0.55s). One rAF
// loop integrates this velocity into a translateX for BOTH the roster and the belt
// slats, so (a) the belt surface moves exactly with the feet and (b) moving the
// slider changes velocity only — position stays continuous, never jumps.
const BELT_PX_PER_SEC = 30;
const SLAT_PX = 16; // one diagonal belt slat is 16px wide (see backgroundSize)
const ROLLER_D = 7; // roller diameter (px); belt travel → roller spin uses its circumference
const DEG_PER_PX = 360 / (Math.PI * ROLLER_D); // angular velocity so rollers roll with the belt

export function AgentRosterFace({ agents = DEFAULT_AGENTS }: { agents?: Agent[] } = {}) {
  // `hovered` only drives which pal plays its GIF — it no longer freezes the belt.
  const [hovered, setHovered] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0.8); // visibly moving at rest; the slider still reaches the same minimum
  const [playing, setPlaying] = useState(true);
  const reduce = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const slatRef = useRef<HTMLDivElement>(null);
  const rollersRef = useRef<HTMLDivElement>(null);

  // Latest values read inside the rAF loop without re-subscribing it.
  const speedRef = useRef(speed);
  const playingRef = useRef(playing);
  const loopRef = useRef(0); // width of one roster copy (px); 0 until measured
  const posRef = useRef(0); // roster translateX (px, ≤ 0)
  const beltRef = useRef(0); // belt slat translateX (px, ≤ 0), wraps every SLAT_PX
  const rollRef = useRef(0); // roller rotation (deg), wraps every 360
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Measure one roster copy's width (track holds the roster twice → half scrollWidth)
  // so the loop wraps seamlessly regardless of sprite sizes.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      // Period = on-screen distance between a sprite and its duplicate in the
      // second copy. NOT scrollWidth/2: the track's pl-4 plus the odd inter-copy
      // gap make half the scroll width ~26px longer than one true roster period,
      // which snapped the roster back by that gap on every wrap.
      const kids = el.children;
      loopRef.current =
        kids.length >= 2 && kids.length % 2 === 0
          ? kids[kids.length / 2].getBoundingClientRect().left -
            kids[0].getBoundingClientRect().left
          : el.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The single scroller. Advances by velocity·dt each frame; changing `speed` only
  // changes velocity, so the on-screen position never discontinuously jumps.
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let prev = 0;
    const tick = (now: number) => {
      if (!prev) prev = now;
      // Clamp dt to ~2 frames: a GC hitch or a background-tab stall must never
      // integrate a huge step into a single visible leap of the belt/roster.
      const dt = Math.min((now - prev) / 1000, 1 / 30);
      prev = now;
      if (playingRef.current) {
        const v = BELT_PX_PER_SEC * speedRef.current; // px/s, shared by pals + belt
        const step = v * dt;
        posRef.current -= step;
        const lp = loopRef.current;
        if (lp > 0 && posRef.current <= -lp) posRef.current += lp;
        beltRef.current -= step;
        if (beltRef.current <= -SLAT_PX) beltRef.current += SLAT_PX;
        // belt travels left, so rollers spin counter-clockwise to roll WITH it
        rollRef.current = (rollRef.current - step * DEG_PER_PX) % 360;
      }
      if (trackRef.current) trackRef.current.style.transform = `translateX(${posRef.current}px)`;
      if (slatRef.current) slatRef.current.style.transform = `translateX(${beltRef.current}px)`;
      if (rollersRef.current) rollersRef.current.style.setProperty("--roll", `${rollRef.current}deg`);
      raf = requestAnimationFrame(tick);
    };
    // A backgrounded tab freezes rAF; on return the next `now` is far ahead of
    // `prev`. Drop the clock (prev=0 → next frame re-seeds it, dt=0) on
    // visibility/focus changes so the resumed frame starts clean instead of
    // taking even the clamped catch-up step.
    const resetClock = () => {
      prev = 0;
    };
    document.addEventListener("visibilitychange", resetClock);
    window.addEventListener("focus", resetClock);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", resetClock);
      window.removeEventListener("focus", resetClock);
    };
  }, [reduce]);

  return (
    <div className="relative isolate h-full overflow-hidden bg-background">
      <div
        ref={trackRef}
        className={cn(
          // Feet-aligned (items-end) so every pal stands on the belt — no floaters.
          // Negative spacing packs them shoulder-to-shoulder; pb clears the belt.
          "relative z-10 flex h-full w-max items-end -space-x-9 pb-[17px] pl-4 will-change-transform"
        )}
      >
        {[...agents, ...agents].map((a, i) => (
          <Sprite
            key={`${a.name}-${i}`}
            agent={a}
            active={hovered === i}
            onEnter={() => setHovered(i)}
            onLeave={() => setHovered((h) => (h === i ? null : h))}
          />
        ))}
      </div>
      <ConveyorBelt slatRef={slatRef} rollersRef={rollersRef} />
      <EdgeBlur side="left" />
      <EdgeBlur side="right" />

      {/* Belt controls, top-left — bare play/pause + speed slider, no panel behind. */}
      <div
        className="absolute left-2.5 top-2.5 z-30 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause belt" : "Play belt"}
          aria-pressed={!playing}
          className="flex h-5 w-5 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" strokeWidth={2.25} fill="currentColor" />
          ) : (
            <Play className="h-3.5 w-3.5" strokeWidth={2.25} fill="currentColor" />
          )}
        </button>
        <Gauge aria-hidden className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" strokeWidth={2.25} />
        <input
          type="range"
          min={0.2}
          max={2.8}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label="Conveyor belt speed"
          className="belt-speed h-2.5 w-16 cursor-pointer text-neutral-500 dark:text-neutral-300"
        />
      </div>
    </div>
  );
}
