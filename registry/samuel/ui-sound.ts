"use client";

/* ── Web Haptics Sound Pack ───────────────────────────────────────────────────
   A tiny Web-Audio synth: one cohesive, premium pack of UI "haptic nubs" wired
   end-to-end site-wide. No audio-file assets — each cue is an oscillator through
   a lowpass (warm, tactile, never a thin digital beep) + a fast-attack /
   exp-decay envelope, so there's nothing to preload and nothing to 404.

   The pack is a WEIGHT LADDER, lightest → firmest, unified in tone, distinct in
   feel (see SOUNDS below):
     hover   — feather nudge, before a click
     haptic  — slider detent tick
     tick    — neutral discrete tap
     select  — a rounded "pock", pick / choose
     on/off  — toggle up / down
     expand/collapse — panel open / close
     success — bright confirming up-arpeggio
     error   — soft low "no", not harsh
     ding    — a warm notification bell (inharmonic partials, long decay)
     reset   — a longer downward sweep, "wiped"
   Every cue is SUBTLE and short (<300ms) and weight-matched to its action.

   Guarantees, per the sounds-on-the-web rules:
   - Never the sole feedback — the island already gives every action a visual
     change; sound only ever accompanies it.
   - Silenced under prefers-reduced-motion (proxy for sound sensitivity).
   - Scoped: only the dynamic toolbar (island) and the Web Haptics post play
     these cues. Every other surface stays silent.
   - Never wired to high-frequency events (strokes, slider drags, hovers) — those
     stay silent. Only discrete state changes make a sound. */

export type SoundName =
  | "hover"
  | "haptic"
  | "tick"
  | "select"
  | "on"
  | "off"
  | "expand"
  | "collapse"
  | "success"
  | "error"
  | "ding"
  | "reset";

/** The pack, in weight order — drives the playable grid in the Web Haptics post. */
export const SOUND_PACK: { name: SoundName; label: string; weight: string }[] = [
  { name: "hover", label: "Hover", weight: "Feather" },
  { name: "haptic", label: "Detent", weight: "Feather" },
  { name: "tick", label: "Tick", weight: "Light" },
  { name: "select", label: "Select", weight: "Light" },
  { name: "on", label: "Toggle on", weight: "Medium" },
  { name: "off", label: "Toggle off", weight: "Medium" },
  { name: "expand", label: "Expand", weight: "Medium" },
  { name: "collapse", label: "Collapse", weight: "Medium" },
  { name: "success", label: "Success", weight: "Firm" },
  { name: "error", label: "Error", weight: "Firm" },
  { name: "ding", label: "Notify", weight: "Firm" },
  { name: "reset", label: "Reset", weight: "Firm" },
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const MASTER_GAIN = 0.26; // subtle by default — chrome, not a game

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// AudioContext must be created/resumed inside a user gesture; every caller here
// is a click handler, so the first cue lazily spins it up.
function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Blip = {
  freq: number;
  slideTo?: number; // exponential glide to this freq over the blip's life
  dur: number; // seconds
  type?: OscillatorType;
  gain?: number; // 0..1 relative to master
  delay?: number; // seconds after "now" to start
  cutoff?: number; // lowpass cutoff (Hz) — lower = warmer, rounder, less digital
};

function blip(b: Blip): void {
  const c = ensure();
  if (!c || !master) return;
  const now = c.currentTime + (b.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  // A lowpass shaves the harsh oscillator top end so every cue reads warm and
  // tactile (a soft "tock") rather than a thin digital beep — the premium feel.
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = b.cutoff ?? 2400;
  lp.Q.value = 0.7;
  osc.type = b.type ?? "sine";
  osc.frequency.setValueAtTime(b.freq, now);
  if (b.slideTo) osc.frequency.exponentialRampToValueAtTime(b.slideTo, now + b.dur);
  const peak = b.gain ?? 0.7;
  // exp ramps can't touch 0 — start/end just above silence to avoid clicks.
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + b.dur);
  osc.connect(lp);
  lp.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + b.dur + 0.03);
}

// A tiny band-passed noise burst — the transient "click" of a real tactile tap.
// Layered under the tonal cues (taps, resets) it adds the physical edge a pure
// oscillator can't, so each cue feels like a surface, not a tone.
function noise(o: { dur: number; gain: number; freq: number; delay?: number }): void {
  const c = ensure();
  if (!c || !master) return;
  const now = c.currentTime + (o.delay ?? 0);
  const len = Math.max(1, Math.ceil(c.sampleRate * o.dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = o.freq;
  bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(o.gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(now);
  src.stop(now + o.dur + 0.02);
}

// Each cue has its OWN identity — a distinct timbre, register and gesture — while
// sharing the warm filtered tone. Taps carry a noise transient (a real surface),
// sweeps glide, the bell rings inharmonic partials. Kept short + quiet so daily
// use never nags.
const SOUNDS: Record<SoundName, () => void> = {
  // feather nudge before a click — a whisper-quiet high tick, nothing else
  hover: () => {
    blip({ freq: 900, dur: 0.012, type: "sine", gain: 0.16, cutoff: 2400 });
  },
  // slider detent — a low wooden "tk": a soft body under a tiny noise click
  haptic: () => {
    noise({ dur: 0.009, gain: 0.08, freq: 1500 });
    blip({ freq: 150, dur: 0.03, type: "sine", gain: 0.42, cutoff: 460 });
  },
  // neutral discrete tap — a crisper mid click, brighter than the detent
  tick: () => {
    noise({ dur: 0.007, gain: 0.06, freq: 3200 });
    blip({ freq: 540, dur: 0.028, type: "triangle", gain: 0.34, cutoff: 2000 });
  },
  // pick / choose — a rounded pluck that lifts in pitch, with a faint overtone
  select: () => {
    blip({ freq: 380, slideTo: 560, dur: 0.06, type: "sine", gain: 0.5, cutoff: 1600 });
    blip({ freq: 900, dur: 0.045, type: "sine", gain: 0.12, cutoff: 2600, delay: 0.004 });
  },
  // toggle on — two rising notes, a bright major-ish step
  on: () => {
    blip({ freq: 494, dur: 0.06, type: "triangle", gain: 0.44, cutoff: 2000 });
    blip({ freq: 740, dur: 0.09, type: "triangle", gain: 0.4, cutoff: 2300, delay: 0.052 });
  },
  // toggle off — the same shape, falling
  off: () => {
    blip({ freq: 660, dur: 0.06, type: "triangle", gain: 0.44, cutoff: 1900 });
    blip({ freq: 415, dur: 0.1, type: "triangle", gain: 0.4, cutoff: 1500, delay: 0.052 });
  },
  // panel opens — a warm sweep up with a soft high sparkle on top
  expand: () => {
    blip({ freq: 320, slideTo: 620, dur: 0.13, type: "sine", gain: 0.55, cutoff: 1900 });
    blip({ freq: 1050, dur: 0.05, type: "sine", gain: 0.14, cutoff: 3000, delay: 0.075 });
  },
  // panel closes — a single warm sweep down (no sparkle, so it's clearly distinct)
  collapse: () => {
    blip({ freq: 640, slideTo: 300, dur: 0.14, type: "sine", gain: 0.5, cutoff: 1600 });
  },
  // success — a bright three-note major arpeggio (D F# A)
  success: () => {
    blip({ freq: 587, dur: 0.08, type: "triangle", gain: 0.4, cutoff: 2600 });
    blip({ freq: 740, dur: 0.08, type: "triangle", gain: 0.4, cutoff: 2800, delay: 0.07 });
    blip({ freq: 880, dur: 0.2, type: "sine", gain: 0.46, cutoff: 3200, delay: 0.14 });
  },
  // error — a low, dull, slightly rough double thud (sawtooth, heavily filtered)
  error: () => {
    blip({ freq: 220, slideTo: 190, dur: 0.11, type: "sawtooth", gain: 0.34, cutoff: 460 });
    blip({ freq: 175, slideTo: 150, dur: 0.14, type: "sawtooth", gain: 0.32, cutoff: 420, delay: 0.1 });
  },
  // notification — a warm bell: a fundamental, an inharmonic partial (the metallic
  // shimmer that makes it a bell not a beep), and a fifth, all with a long decay
  ding: () => {
    blip({ freq: 784, dur: 0.5, type: "sine", gain: 0.48, cutoff: 4200 });
    blip({ freq: 784 * 2.76, dur: 0.38, type: "sine", gain: 0.1, cutoff: 5200 });
    blip({ freq: 1175, dur: 0.55, type: "sine", gain: 0.26, cutoff: 4600, delay: 0.02 });
  },
  // reset — the longest gesture: a downward sweep with a soft noise whoosh under it
  reset: () => {
    blip({ freq: 700, slideTo: 150, dur: 0.28, type: "sine", gain: 0.5, cutoff: 1500 });
    noise({ dur: 0.26, gain: 0.035, freq: 700 });
  },
};

// The high-frequency cues (hover, slider steps) are throttled so a sweep across
// the island reads as a soft patter, never a stacked drone.
const lastAt: Partial<Record<SoundName, number>> = {};

/** Play a named chrome cue. No-ops under reduced-motion or SSR. */
export function playSound(name: SoundName): void {
  if (typeof window === "undefined") return;
  if (reducedMotion()) return;
  if (name === "hover" || name === "haptic") {
    const now = performance.now();
    const min = name === "hover" ? 45 : 24;
    if (now - (lastAt[name] ?? 0) < min) return;
    lastAt[name] = now;
  }
  SOUNDS[name]?.();
}
