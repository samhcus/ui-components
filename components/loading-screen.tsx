"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Cinematic first-load curtain — plays on every full page load:
 *  1. "Welcome to my website" rises in word-by-word (blur + lift) and holds.
 *  2. It blurs away to "my name is" — a short spoken-aloud beat, same welcome-line
 *     size/style, that holds briefly then blurs away in turn.
 *  3. The Inter "Samuel" wordmark SLAMS into place — a punchy scale/blur/opacity
 *     stamp with a hair of overshoot, not a soft fade — holds briefly, THEN glitches
 *     through the site's other faces, each in its own character colour — swaps fire
 *     fast and decelerate EXPONENTIALLY, with a motion-blur and a hair of scale that
 *     both ease to rest, so it brakes into a lock (not a slideshow) — then resolves
 *     to the clean monochrome Inter mark.
 *  4. A hairline loading bar rides under the mark the whole time — a single flat
 *     monochrome fill (colour lives in the wordmarks only). It fills on its OWN
 *     steady, linear, independently-timed schedule — never keyed to the glitch's
 *     swap index or its exponential brake — tuned so it reaches 100% exactly as the
 *     mark commits to the clean settle, so bar-full and mark-settled read as one
 *     landing.
 *  5. The whole sheet lifts up and fades out, dropping the visitor into the site.
 *
 * The whole timeline runs off ONE JS clock (started at mount), so pacing is
 * deterministic and never coupled to cold-cache hydration/font latency. Renders on
 * the server too (blank curtain, words revealed on start) so the site is never
 * briefly visible. Reduced motion collapses to a brief static "Samuel" then a plain
 * opacity fade (no translate).
 *
 * The state machine itself lives in `useLoaderTimeline` below so a second consumer
 * (the replayable `LoaderDemo` embed) can drive the exact same timeline — never a
 * re-derived copy that can drift from what ships. `LoadingScreen` only plays on the
 * homepage (see the `pathname === "/"` gate below) — every other route never shows it.
 */
export type Phase = "welcome" | "name" | "mark" | "out" | "done";

export const WELCOME_HOLD = 1050; // words rise (~900ms) + a short hold before the handoff
export const NAME_HOLD = 720; // "my name is" holds before it hands off to the mark
// "my name is" types out character by character rather than fading in whole (see
// nameChars below) — NAME_TYPE_DURATION is spent typing, the rest of NAME_HOLD is a
// plain hold on the finished phrase before the handoff to the mark.
export const NAME_TEXT = "my name is";
export const NAME_TYPE_DURATION = 460; // ms to type all of NAME_TEXT

// The per-character dwell schedule for the typewriter — spoken cadence, not a flat
// metronome. Weighted (not raw ms): 1x for a quick mid-word letter, 1.5x for the
// last letter of a word (the "hair longer" landing), 2x for the two spaces (the
// spoken pause at a word boundary). A FIXED per-char jitter (±10-15ms, hand-tuned
// — never Math.random, so LoaderDemo replays byte-identical and never desyncs)
// layers organic variation on top without fighting the cadence: negative on the
// already-quick mid-word letters, positive on the letters/spaces meant to hold.
const NAME_WORDS = NAME_TEXT.split(" ");
const NAME_DWELL_WEIGHT = { normal: 1, wordFinal: 1.5, space: 2 } as const;
const NAME_JITTER = [-10, 12, 14, -12, -11, -13, 14, 15, -10, 11];
function computeNameDwells(): number[] {
  const weights: number[] = [];
  let wordIdx = 0;
  let charInWord = 0;
  for (const ch of NAME_TEXT) {
    if (ch === " ") {
      weights.push(NAME_DWELL_WEIGHT.space);
      wordIdx += 1;
      charInWord = 0;
      continue;
    }
    const isWordFinal = charInWord === NAME_WORDS[wordIdx].length - 1;
    weights.push(isWordFinal ? NAME_DWELL_WEIGHT.wordFinal : NAME_DWELL_WEIGHT.normal);
    charInWord += 1;
  }
  const unit = NAME_TYPE_DURATION / weights.reduce((sum, w) => sum + w, 0);
  return weights.map((w, i) => Math.round(w * unit) + NAME_JITTER[i % NAME_JITTER.length]);
}
// Computed once at module load — deterministic across every run and both consumers.
export const NAME_DWELLS = computeNameDwells();
// The mark's entrance is a stamp, not a fade: it SLAMS to rest, THEN the glitch
// begins. SLAM_DURATION is the stamp itself (scale/blur/opacity in one punchy
// beat); SLAM_HOLD is the brief rest on the clean Inter mark before the shuffle
// fires, so the landing is actually seen before the glitch interrupts it.
export const SLAM_DURATION = 220; // ms — scale 1.28 → ~0.97 → 1, blur 12px → 0, opacity 0 → 1
export const SLAM_HOLD = 140; // ms — held at rest before the glitch begins
export const MARK_INTRO = SLAM_DURATION + SLAM_HOLD; // the clean Inter mark is fully seen before the glitch begins
export const SETTLE_HOLD = 400; // rest on the settled Inter mark before the lift (> the 320ms
// settle transition, so the clean mono Inter landing is fully seen before the curtain goes)
export const LIFT = 680; // curtain wipe-out (opaque slide-up reveal, no fade)

// A fixed, slightly-irregular offset per welcome word (not i * uniform-stagger) so the
// rise reads hand-set. Deterministic — never randomised, the whole timeline stays reproducible.
export const WORD_DELAYS = [0, 95, 205, 300];
// The bar arrives as the 5th beat of the welcome stagger, same blur+lift family.
export const BAR_ENTRANCE = 380;
// Never a literal 0px sliver — the bar always reads as "already moving" the instant it appears.
export const PROGRESS_SEED = 0.06;
// The bar's fill is a single continuous, independently-timed CSS transition from the
// seed to 100% — never keyed to the glitch's swap index or its exponential brake. Its
// duration is derived so the fill just happens to land near the settle, nothing more.
export const REDUCED_BAR_FILL = 300; // ms — reduced motion's short, plain fill

// The switchable site faces (from layout.tsx), each paired with a character colour
// that suits its personality. Inter is the canonical mark, so it opens and settles
// the sequence in monochrome; the colour + character live strictly in the shuffle.
// Colours verified ≥3:1 on both #fff and #111 (WCAG); indigo gets a lighter value on
// dark where the base #4263EB drops out of the rhythm.
const INDIGO_DARK = "#5C7CFA";
export const GLITCH_FACES = [
  { font: "var(--font-nunito)", color: "#E8590C" }, // rounded + friendly → burnt orange
  { font: "var(--font-space-grotesk)", color: "#4263EB" }, // techy grotesque → indigo
  { font: "var(--font-fraunces)", color: "#AE3EC9" }, // expressive serif → grape
  { font: "var(--font-space-mono)", color: "#2B8A3E" }, // retro mono → terminal green
  { font: "var(--font-instrument-serif)", color: "#D6336C" }, // editorial serif → rose
  { font: "var(--font-bricolage)", color: "#F03E3E" }, // bold display → red
  { font: "var(--font-lora)", color: "#099268" }, // classic serif → teal
  { font: "var(--font-geist-mono)", color: "#0C8599" }, // clean mono → cyan
];
export const INTER = "var(--font-inter)";

// Exponential deceleration: interval grows geometrically from MIN to MAX across the
// shuffle (ratio ~27), so it opens as a near-unreadable smear and brakes hard into rest.
export const GLITCH_SWAPS = 12;
export const MIN_DELAY = 12; // ms — first, fastest interval
export const MAX_DELAY = 320; // ms — last interval before settle
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"; // house --ease-out
// The settle's scale eases with a mild back-ease (overshoot ~1.006) so the mark ARRIVES
// rather than just stopping; blur/colour/opacity stay on the house ease-out.
export const SETTLE_SCALE_EASE = "cubic-bezier(0.34, 1.35, 0.64, 1)";

// The slam-in's starting pose: wound up big, soft and hidden, so the stamp has
// somewhere to fall FROM (see ENTER_START below).
export const SLAM_SCALE = 1.28;
export const SLAM_BLUR = 12; // px
// A real back-ease — overshoots PAST the target in the direction of travel. This
// shrinks from 1.28 down to 1, so the overshoot reads as the scale dipping to ~0.97
// before rebounding to rest: a hard landing with a hair of recoil, not a stop. Much
// stronger than SETTLE_SCALE_EASE's ~1.006 nudge, which only has to arrest the tiny
// residual velocity left at the end of the glitch, not a full 0.28 of scale.
export const SLAM_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// The exponential swap curve's own total run time, summed once from the same MIN/MAX/
// SWAPS constants the glitch loop uses — purely derived, never a duplicated magic number.
function computeGlitchTotal() {
  let total = 0;
  for (let i = 0; i < GLITCH_SWAPS; i += 1) {
    const p = i / (GLITCH_SWAPS - 1);
    total += MIN_DELAY * Math.pow(MAX_DELAY / MIN_DELAY, p);
  }
  return total;
}
const GLITCH_TOTAL = computeGlitchTotal(); // ~1205ms

// The bar's own fill duration: from the instant its fill transition actually starts
// (BAR_ENTRANCE + the 20ms seed beat below) to the EXACT instant the mark commits to
// the clean settle — a single steady number, completely decoupled from how the glitch
// itself decelerates. Landing here (not "roughly") is what makes bar-full and
// mark-settled read as one beat instead of the bar finishing ~1s early.
export const BAR_FILL_DURATION = Math.round(
  WELCOME_HOLD + NAME_HOLD + MARK_INTRO + GLITCH_TOTAL - (BAR_ENTRANCE + 20),
);

export type MarkState = {
  font: string;
  color: string; // "" → inherit the monochrome foreground
  blur: number; // px motion-blur, eases to 0
  scale: number; // eases to 1
  // "presnap": the wound-up slam start, committed with zero transition so it's a real
  // starting pose (not an animated one). "enter": the stamp + hold, transition-eased
  // on SLAM_EASE. "shuffle": the fast glitch, transition killed so swaps stay crisp.
  // "settle": the final lock back to clean Inter, eased with SETTLE_SCALE_EASE.
  stage: "presnap" | "enter" | "shuffle" | "settle";
};

export const REST_MARK: MarkState = { font: INTER, color: "", blur: 0, scale: 1, stage: "settle" };
// The slam's two keyframes, committed a paint apart (double rAF, see
// useLoaderTimeline) so the browser actually paints the wound-up ENTER_START pose
// before the transition to ENTER_TARGET has something to animate from.
const ENTER_START: MarkState = { font: INTER, color: "", blur: SLAM_BLUR, scale: SLAM_SCALE, stage: "presnap" };
const ENTER_TARGET: MarkState = { font: INTER, color: "", blur: 0, scale: 1, stage: "enter" };

// The bar is a single flat monochrome fill the whole run (foreground) — colour is a
// wordmark-only moment, never chrome. No per-face colour linkage, no gradients.
export const BAR_FILL = "var(--foreground)";

/**
 * The loader's state machine, extracted so it can be shared byte-for-byte between
 * the real site-wide `LoadingScreen` and any isolated replay (e.g. a design-post
 * demo embed). `active` gates the run (the demo waits for `active` before starting);
 * bumping `loopKey` while `active` stays true re-arms the whole sequence from
 * "welcome" — that's the ONLY way to replay it, never a manual phase reset.
 */
export function useLoaderTimeline({
  active,
  loopKey,
}: {
  active: boolean;
  loopKey?: number;
}) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [mark, setMark] = useState<MarkState>(REST_MARK);
  const [progress, setProgress] = useState(0);
  // Gates the bar's CSS transition: false while it jumps instantly to its seed value,
  // true once the single long steady fill (seed → 100%) is set in motion.
  const [barFilling, setBarFilling] = useState(false);
  // True for a brief window right as the fill locks to 100% — the same instant the
  // mark commits to REST_MARK — so the render can add a one-shot "confident finish"
  // flourish without touching the fill's own steady ramp.
  const [barSettled, setBarSettled] = useState(false);
  // How many characters of NAME_TEXT are currently typed in — drives the "my name
  // is" typewriter reveal (see the self-scheduling typeStep loop below).
  const [nameChars, setNameChars] = useState(0);
  const [started, setStarted] = useState(false); // gates the word entrance to the JS clock
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafs = useRef<number[]>([]);
  const reduceRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    // (Re)arm a fresh run — fires on mount, and again whenever loopKey bumps.
    timers.current = [];
    rafs.current = [];
    setPhase("welcome");
    setMark(REST_MARK);
    setProgress(0);
    setBarFilling(false);
    setBarSettled(false);
    setNameChars(0);
    setStarted(false);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceRef.current = reduce;
    const isDark =
      typeof document !== "undefined" && document.documentElement.classList.contains("dark");

    const push = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };
    const finish = () => {
      setPhase("out");
      push(() => setPhase("done"), LIFT);
    };

    // Reduced motion: skip straight to a brief static mark, then a plain fade. The bar
    // still fills, on its own short plain schedule — no aperture, no decorative motion.
    if (reduce) {
      setPhase("mark");
      setProgress(PROGRESS_SEED);
      push(() => {
        setBarFilling(true);
        setProgress(1);
      }, 60);
      push(finish, 550);
      return () => timers.current.forEach(clearTimeout);
    }

    // Start the deterministic timeline. The word entrance begins now (not on paint),
    // so its cadence never drifts with hydration/font latency.
    setStarted(true);

    // Shuffle the glitch face order once per run (client-only, no SSR mismatch) so
    // the same 0-3 faces don't open every load in the same pattern.
    const faces = [...GLITCH_FACES];
    for (let idx = faces.length - 1; idx > 0; idx -= 1) {
      const j = Math.floor(Math.random() * (idx + 1));
      [faces[idx], faces[j]] = [faces[j], faces[idx]];
    }

    // The bar seeds in with the welcome words, then runs ONE continuous, independently
    // eased fill straight to 100% — a fixed duration derived once above, never touched
    // again by the glitch loop below. Its pace has nothing to do with the wordmark's.
    push(() => setProgress(PROGRESS_SEED), BAR_ENTRANCE);
    push(() => {
      setBarFilling(true);
      setProgress(1);
    }, BAR_ENTRANCE + 20);

    // 1. Welcome rises and holds, then hands off to the spoken "my name is" beat,
    //    which types itself out character by character (self-scheduling, like the
    //    glitch step loop below) rather than fading in as a finished phrase.
    push(() => {
      setPhase("name");
      const total = NAME_TEXT.length;
      let c = 0;
      const typeStep = () => {
        c += 1;
        setNameChars(c);
        if (c < total) timers.current.push(setTimeout(typeStep, NAME_DWELLS[c - 1]));
      };
      typeStep();
    }, WELCOME_HOLD);

    // 2. "my name is" holds briefly, then the clean Inter "Samuel" mark SLAMS into
    //    place — wound up (ENTER_START) then, a paint later, released to rest
    //    (ENTER_TARGET) so the transition has a real starting pose to animate from.
    //    A double rAF guarantees the browser commits ENTER_START before ENTER_TARGET
    //    fires the transition (a single rAF can still land in the same paint).
    push(() => {
      setPhase("mark");
      setMark(ENTER_START);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setMark(ENTER_TARGET));
        rafs.current.push(raf2);
      });
      rafs.current.push(raf1);
    }, WELCOME_HOLD + NAME_HOLD);

    // 3. Glitch: self-scheduling swaps on an exponential interval curve. Colour,
    //    motion-blur and scale all ease toward rest so it brakes into a lock. The bar
    //    (above) is NOT touched here — it's already running its own independent fill,
    //    tuned to land on 100% at the exact instant REST_MARK commits below.
    push(() => {
      let i = 0;
      const step = () => {
        if (i >= GLITCH_SWAPS) {
          setMark(REST_MARK); // resolve to the clean monochrome Inter mark
          setBarSettled(true); // the bar's own fill also lands here — same beat
          push(finish, SETTLE_HOLD);
          return;
        }
        const p = i / (GLITCH_SWAPS - 1); // 0 → 1 across the shuffle
        const face = faces[i % faces.length];
        const isLast = i === GLITCH_SWAPS - 1;
        const color =
          isDark && face.font.includes("space-grotesk") ? INDIGO_DARK : face.color;
        setMark({
          font: face.font,
          color,
          // Blur holds through the tail (^0.85) so the penultimate swaps stay smeared
          // and only the final face lands crisp — a continuous brake, not held cards.
          // Peak is 12px (was 3.4) — below ~10px the smear never crossed the perception
          // threshold at 90-140px cap height and every frame rendered crisp regardless
          // of how fast the timing braked. Same falloff shape, just amplified.
          // The last frame compresses to 0.99 so the settle's back-ease overshoots into rest.
          blur: 12 * Math.pow(1 - p, 0.85),
          scale: isLast ? 0.99 : 1 + 0.15 * Math.pow(1 - p, 1.2),
          stage: "shuffle",
        });
        // Exponential (geometric) growth: MIN·(MAX/MIN)^p.
        const delay = MIN_DELAY * Math.pow(MAX_DELAY / MIN_DELAY, p);
        i += 1;
        timers.current.push(setTimeout(step, delay));
      };
      step();
    }, WELCOME_HOLD + NAME_HOLD + MARK_INTRO);

    return () => {
      timers.current.forEach(clearTimeout);
      rafs.current.forEach(cancelAnimationFrame);
    };
  }, [active, loopKey]);

  return { phase, mark, progress, barFilling, barSettled, nameChars, started, reduce: reduceRef.current };
}

/**
 * The bar fill's transition — one steady, independently-timed schedule (see doc
 * comment above). Deliberately `linear`, NOT the house `--ease-out`: that curve is
 * built for short (<600ms) UI transitions and is so aggressive it reaches ~97% of
 * its travel by the HALFWAY point of any duration, regardless of length — stretched
 * across this bar's ~2.8s fill it made the bar visually finish around 2.2s while
 * still numerically animating, imperceptibly, for another second. A linear ramp is
 * the one that actually reads as "filling evenly the whole time" and lands exactly
 * on 100% at the instant BAR_FILL_DURATION elapses — which is tuned to be the mark's
 * settle instant. The "confident finish" polish lives in `barSettled` below instead
 * of in the ramp's easing.
 */
export function barFillStyle({
  progress,
  barFilling,
  reduce,
}: {
  progress: number;
  barFilling: boolean;
  reduce: boolean;
}): CSSProperties {
  return {
    transform: `scaleX(${progress})`,
    backgroundColor: BAR_FILL,
    transitionProperty: barFilling ? "transform" : "none",
    transitionDuration: `${reduce ? REDUCED_BAR_FILL : BAR_FILL_DURATION}ms`,
    transitionTimingFunction: reduce ? "var(--ease-out)" : "linear",
  };
}

/**
 * The mark's filter/transform/transition for its current stage — shared so the
 * slam-in, shuffle, and settle transitions can never drift between `LoadingScreen`
 * and `LoaderDemo`. `showMark` stays false through the welcome/name beats AND the
 * one "presnap" frame right before the stamp, so opacity slams in together with
 * scale/blur — never a bare fade with scale/blur bolted on after.
 */
export function markStyle({
  phase,
  mark,
}: {
  phase: Phase;
  mark: MarkState;
}): { showMark: boolean; filter: string; transform: string; transition: string } {
  const showMark = phase !== "welcome" && phase !== "name" && mark.stage !== "presnap";
  const filter = mark.blur > 0 ? `blur(${mark.blur}px)` : "blur(0px)";
  const transform = `scale(${mark.scale})`;
  const transition =
    mark.stage === "presnap" || mark.stage === "shuffle"
      ? "none"
      : mark.stage === "enter"
        ? `transform ${SLAM_DURATION}ms ${SLAM_EASE}, opacity ${SLAM_DURATION}ms ${EASE_OUT}, filter ${SLAM_DURATION}ms ${EASE_OUT}`
        : `transform 320ms ${SETTLE_SCALE_EASE}, opacity 300ms ${EASE_OUT}, filter 300ms ${EASE_OUT}, color 300ms ${EASE_OUT}`;
  return { showMark, filter, transform, transition };
}

/**
 * Ambient geometric chrome for the curtain's empty space — a ring, a square, and a
 * triangle, each a faint monochrome foreground tint (colour stays a wordmark-only
 * moment) drifting on pure CSS keyframes, so they're free and never touch the JS
 * clock driving the mark/bar. Shared between `LoadingScreen` and `LoaderDemo` so the
 * two can never visually drift. Absolutely positioned (escapes the curtain's `grid
 * place-items-center`) and painted before the mark group, so it always sits behind it.
 */
export function LoaderAmbient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="loader-shape-ring absolute left-[8%] top-[18%] h-12 w-12 rounded-full border-2 border-dashed border-foreground/[0.12] md:h-20 md:w-20" />
      <span className="loader-shape-square absolute bottom-[16%] right-[9%] h-9 w-9 rounded-md border-2 border-foreground/[0.12] md:h-14 md:w-14" />
      <svg viewBox="0 0 44 40" className="loader-shape-tri absolute right-[12%] top-[22%] h-7 w-7 text-foreground/[0.12] md:h-11 md:w-11">
        <polygon points="22,3 41,37 3,37" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function LoadingScreen() {
  // Only the homepage plays the curtain — every other route (/components, /writing,
  // /design, the sandbox, any post) never shows it, not even a flash.
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { phase, mark, progress, barFilling, barSettled, nameChars, started, reduce } = useLoaderTimeline({
    active: isHome,
  });

  if (!isHome || phase === "done") return null;

  const leaving = phase === "out";
  const words = ["Welcome", "to", "my", "website"];
  const { showMark, filter: markFilter, transform: markTransform, transition: markTransition } =
    markStyle({ phase, mark });

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100000] grid place-items-center overflow-hidden bg-background",
        // A soft leading-edge shadow so the sheet reads as peeling up OFF the page as it
        // wipes (invisible during the load — it sits just below the viewport's bottom edge).
        // NOTE: Tailwind v4 `-translate-y-full` sets the `translate` PROPERTY (not
        // `transform`), so the transition MUST list `translate` or the wipe snaps instantly.
        "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.28)] transition-[translate,opacity]",
        leaving && "pointer-events-none",
        // Non-reduced: an OPAQUE wipe. The sheet slides up and reveals the site as a solid
        // panel (no fade), so it wipes away instead of dissolving into a hard cut.
        leaving && !reduce && "-translate-y-full",
        // Reduced motion: a plain fade, no translate.
        leaving && reduce && "opacity-0",
      )}
      style={{
        transitionDuration: `${LIFT}ms`,
        transitionTimingFunction: reduce ? EASE_OUT : "var(--ease-drawer)",
      }}
    >
      <LoaderAmbient />

      {/* Warm the glitch faces from first paint so they're cached before the shuffle.
          These faces are preload:false, so without this they'd download only when a
          swap first uses them — mid-glitch, far slower than the swaps — and render as
          the Inter fallback, making the glitch look absent. Parked off-screen (not
          display:none, which skips font loading). */}
      <div className="pointer-events-none absolute left-[-9999px] top-0 select-none text-5xl font-bold" aria-hidden>
        {[...GLITCH_FACES.map((f) => f.font), INTER].map((f) => (
          <span key={f} style={{ fontFamily: f, fontSizeAdjust: "none" }}>
            Samuel
          </span>
        ))}
      </div>

      {/* Mark + bar group — rides the curtain's own lift/fade, no separate motion of its own. */}
      <div className="flex flex-col items-center gap-6 md:gap-8">
        <div className="grid place-items-center">
          {/* Welcome line — words rise + unblur, staggered on a fixed irregular offset,
              revealed on the JS clock (hidden until `started`); blurs away on handoff. */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 text-center [grid-area:1/1]",
              "text-3xl font-semibold tracking-tight text-foreground md:text-5xl",
              "transition-[opacity,filter] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
              phase !== "welcome" && "opacity-0 blur-[6px]",
            )}
          >
            {words.map((w, i) => (
              <span
                key={w}
                className={cn("inline-block", started ? "loader-word" : "opacity-0")}
                style={{ animationDelay: `${WORD_DELAYS[i]}ms` }}
              >
                {w}
              </span>
            ))}
          </div>

          {/* "my name is" — a short spoken-aloud beat between the welcome and the mark,
              same size/style as the welcome line, crossfading through the same blur
              bridge. Types itself out character by character (nameChars) rather than
              fading in as a finished phrase, with a blinking caret riding the reveal. */}
          <div
            className={cn(
              "px-6 text-center [grid-area:1/1]",
              "text-3xl font-semibold tracking-tight text-foreground md:text-5xl",
              "transition-[opacity,filter] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
              phase !== "name" && "opacity-0 blur-[6px]",
            )}
          >
            {NAME_TEXT.slice(0, nameChars)}
            {phase === "name" && (
              <span aria-hidden className="loader-caret ml-0.5 inline-block h-[0.8em] w-[2px] translate-y-[0.08em] bg-foreground align-middle" />
            )}
          </div>

          {/* Samuel mark — SLAMS into place on handoff (scale/blur/opacity in one punchy
              stamp with a hair of overshoot), holds, then glitches through the coloured
              faces and settles on the clean Inter mark. The transition is killed
              entirely during the fast shuffle so the rapid swaps stay crisp.
              fontSizeAdjust:none keeps each face's true proportions. */}
          <span
            className={cn(
              "select-none text-5xl font-bold tracking-tight text-foreground [grid-area:1/1] md:text-7xl",
              showMark ? "opacity-100" : "opacity-0",
            )}
            style={{
              fontFamily: mark.font,
              fontSizeAdjust: "none",
              color: mark.color || undefined,
              filter: markFilter,
              transform: markTransform,
              transition: markTransition,
            }}
          >
            Samuel
          </span>
        </div>

        {/* Loading bar — a separate persistent element, arrives as the 5th welcome
            beat and rides under the mark through the glitch and settle. Track is a
            faint monochrome tint; fill is flat foreground the whole run — colour is a
            wordmark-only moment, never chrome. It fills on its own steady, LINEAR,
            independently-timed schedule (see barFillStyle) tuned to reach 100% at the
            exact instant the mark commits to the settle — `barSettled` triggers a
            brief confident-finish glow right on that landing, never on the ramp
            itself. */}
        <div
          className={cn(reduce ? "opacity-100" : started ? "loader-word" : "opacity-0")}
          style={reduce ? undefined : { animationDelay: `${BAR_ENTRANCE}ms` }}
        >
          <div className="loader-track relative h-[3px] w-32 rounded-full md:w-52">
            <div
              className={cn(
                "absolute inset-0 origin-left rounded-full",
                barSettled && !reduce && "loader-bar-settle",
              )}
              style={barFillStyle({ progress, barFilling, reduce })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
