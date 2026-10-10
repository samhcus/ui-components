"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ── ambient background effects ──────────────────────────────────────────────
   A single viewport-sized canvas that lives BEHIND the page content (-z-10, so it
   paints over the base background colour but under everything in #mh-page).

   Effects are PARKED IN THE DOCUMENT, not glued to the glass: every particle lives
   in document-space Y and is drawn at `y - scrollY`, so scrolling moves past them
   the way it moves past a drawing or the cat — they stay where they fell. The
   canvas itself stays viewport-sized (cheap: aurora/mist full-fills and the dither
   field only ever cost a screenful) and, being `fixed`, never inflates
   scrollHeight, so there's no measure-collapse dance.

   Every effect is deliberately faint — texture, not chrome — and theme-aware
   (neutral ink flips light/dark; a custom tint overrides it; embers keep a warm
   glow). Only one runs at a time; switching reseeds. Respects reduced-motion
   (particles hold still but still park to the document on scroll).
   Extensible: add an id to EffectId + EFFECTS + a `seed`/`step` case. */

export type EffectId =
  | "snow"
  | "rain"
  | "embers"
  | "aurora"
  | "dither"
  | "stars"
  | "bubbles"
  | "mist"
  | "fireflies"
  | "petals"
  | "meteors"
  | "bokeh"
  | "network"
  | "ripples"
  | "dust"
  | "sparkle"
  | "warp"
  | "matrix"
  | "spotlight"
  | "waves"
  | "vortex"
  | "confetti"
  | "balloons"
  | "grain";

// Ordered for a 3-row × 8-column picker: row 1 is discrete bits that fall or rise,
// row 2 is light & energy, row 3 is soft ambient fields & flow.
export const EFFECTS: { id: EffectId; label: string }[] = [
  // row 1 — falling / rising bits
  { id: "snow", label: "Snow" },
  { id: "rain", label: "Rain" },
  { id: "petals", label: "Petals" },
  { id: "confetti", label: "Confetti" },
  { id: "bubbles", label: "Bubbles" },
  { id: "balloons", label: "Balloons" },
  { id: "dust", label: "Dust" },
  { id: "meteors", label: "Meteors" },
  // row 2 — light & energy
  { id: "embers", label: "Fire" },
  { id: "fireflies", label: "Fireflies" },
  { id: "stars", label: "Stars" },
  { id: "sparkle", label: "Sparkle" },
  { id: "warp", label: "Warp" },
  { id: "matrix", label: "Matrix" },
  { id: "network", label: "Network" },
  { id: "ripples", label: "Ripples" },
  // row 3 — soft fields & flow
  { id: "aurora", label: "Aurora" },
  { id: "mist", label: "Mist" },
  { id: "bokeh", label: "Bokeh" },
  { id: "spotlight", label: "Spotlight" },
  { id: "grain", label: "Grain" },
  { id: "waves", label: "Waves" },
  { id: "vortex", label: "Vortex" },
  { id: "dither", label: "Dither" },
];

type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; life: number; seed: number; li?: number; spark?: boolean };

const rnd = () => Math.random();
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
// Glyph set for the matrix code-rain — indexed by a particle's `seed` (0..1).
const MATRIX_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789ABCDEF#$%";

// Fire colour ramp keyed to a particle's age L∈[0,1]: a white-yellow hot core at
// the base, cooling up through orange and red-orange to deep red and char at the
// tips. Under additive ("lighter") blending, overlapping blobs stack into the
// glowing, blown-out flame wall real fire has. Simple piecewise-linear lerp.
const FIRE_STOPS: [number, number, number, number][] = [
  [0.0, 255, 246, 205],
  [0.2, 255, 168, 44],
  [0.48, 240, 92, 24],
  [0.76, 168, 34, 12],
  [1.0, 92, 20, 10],
];
function rampColor(stops: [number, number, number, number][], L: number): [number, number, number] {
  const x = L <= 0 ? 0 : L >= 1 ? 1 : L;
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [p0, r0, g0, b0] = stops[i - 1];
      const [p1, r1, g1, b1] = stops[i];
      const f = (x - p0) / (p1 - p0 || 1);
      return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
    }
  }
  const s = stops[stops.length - 1];
  return [s[1], s[2], s[3]];
}

export function BackgroundEffects({
  effect,
  dark,
  reduce,
  color = null,
  opacity = 1,
  host = null,
}: {
  effect: EffectId | null;
  dark: boolean;
  reduce: boolean | null;
  /** "r,g,b" tint for the particles, or null for the theme-adaptive neutral. */
  color?: string | null;
  /** global alpha multiplier (0..1), applied live inside the draw calls. */
  opacity?: number;
  /** the element that owns the scroll (an open post overlay), or null for the
   *  document. The canvas portals into it and parks to its scrollTop, so effects
   *  show behind post content and scroll with it — same as the ink canvas. */
  host?: HTMLElement | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  // A bare container appended DIRECTLY to <html> (not <body>). The page canvas must
  // live outside <body> because on mobile the body carries `zoom` + a frozen 390px
  // width, and CSS `zoom` scales/relocates its `fixed` descendants, so a body-hosted
  // canvas shrinks below the viewport and its pixels drift from the innerWidth math.
  // We can't portal into `document.documentElement` directly: react-dom redirects a
  // portal whose container is the documentElement back into <body>. Appending our own
  // node to <html> and portalling into that sidesteps the redirect and stays zoom-free.
  const [fxRoot, setFxRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMounted(true);
    const el = document.createElement("div");
    el.setAttribute("data-fx-root", "");
    document.documentElement.appendChild(el);
    setFxRoot(el);
    return () => { el.remove(); };
  }, []);
  const effRef = useRef(effect);
  const darkRef = useRef(dark);
  const reduceRef = useRef(reduce);
  const colorRef = useRef(color);
  const opacityRef = useRef(opacity);
  const hostRef = useRef(host);
  effRef.current = effect;
  darkRef.current = dark;
  reduceRef.current = reduce;
  colorRef.current = color;
  opacityRef.current = opacity;
  hostRef.current = host;

  const ditherRef = useRef<{ buf: HTMLCanvasElement; iw: number; ih: number } | null>(null);
  const grainRef = useRef<{ buf: HTMLCanvasElement; iw: number; ih: number } | null>(null);
  const partsRef = useRef<Particle[]>([]);
  const seedForRef = useRef<EffectId | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, docH: 0 });

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      // The canvas is viewport-sized (the overlay is itself fixed inset-0, so the
      // window dims cover it). Only the parking RANGE follows the scroll host.
      const w = window.innerWidth;
      const h = window.innerHeight;
      const hostEl = hostRef.current;
      const docH = hostEl
        ? Math.max(hostEl.scrollHeight, hostEl.clientHeight)
        : Math.max(document.documentElement.scrollHeight, h);
      const { docH: previousDocH } = sizeRef.current;
      sizeRef.current = { w, h, docH };
      const width = Math.round(w * dpr);
      const height = Math.round(h * dpr);
      // Font swaps can resize the document without resizing this viewport canvas.
      // Reallocating its bitmap on every hop clears the animation and its buffers.
      if (canvas.width === width && canvas.height === height && ditherRef.current) {
        if (docH !== previousDocH) seedForRef.current = null;
        return;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const iw = Math.max(1, Math.round(w / 5));
      const ih = Math.max(1, Math.round(h / 5));
      const buf = ditherRef.current?.buf ?? document.createElement("canvas");
      buf.width = iw;
      buf.height = ih;
      ditherRef.current = { buf, iw, ih };
      // Grain's own small buffer, at a coarser resolution than dither's — chunkier
      // pixels read as film grain rather than a dither field.
      const giw = Math.max(1, Math.round(w / 4));
      const gih = Math.max(1, Math.round(h / 4));
      const gbuf = grainRef.current?.buf ?? document.createElement("canvas");
      gbuf.width = giw;
      gbuf.height = gih;
      grainRef.current = { buf: gbuf, iw: giw, ih: gih };
      seedForRef.current = null; // reseed: counts scale with the scroller's area
    };
    resize();
    window.addEventListener("resize", resize);
    // The scroller grows/shrinks (fonts, expanding panels, post content) →
    // re-measure. Observe whatever owns the scroll.
    const ro = new ResizeObserver(resize);
    ro.observe(host ?? document.body);

    const ink = () => colorRef.current ?? (darkRef.current ? "255,255,255" : "20,20,20");

    // Fire is welded to the bottom of the DOCUMENT (base at docH), like every
    // other effect it parks to document-space Y and is drawn at `y - scrollY`, so
    // it stays at the foot of the page and scrolls with it rather than tracking
    // the viewport. Bodies are big soft blobs that build the flame wall and die
    // low; sparks are bright embers that ride the heat column far up the page.
    // Respawn keeps each particle's own kind so the two populations stay balanced.
    const spawnFlame = (w: number, docH: number, spark: boolean): Particle =>
      spark
        ? {
            x: rnd() * w,
            y: docH + rnd() * 26,
            r: 1.1 + rnd() * 2.3,
            vx: (rnd() - 0.5) * 0.7,
            vy: -(2.6 + rnd() * 4.2),
            a: 0.6 + rnd() * 0.4,
            life: 0,
            li: 0.0015 + rnd() * 0.0042, // long-lived → climbs far up the page
            seed: rnd() * 6.283,
            spark: true,
          }
        : {
            x: rnd() * w,
            y: docH + rnd() * 14,
            r: 11 + rnd() * 30,
            vx: (rnd() - 0.5) * 0.5,
            vy: -(1.1 + rnd() * 3),
            a: 0.5 + rnd() * 0.5,
            life: 0,
            li: 0.011 + rnd() * 0.022, // dies low → forms the flame body
            seed: rnd() * 6.283,
            spark: false,
          };

    // Meteors are the one VIEWPORT-locked effect (they cross the glass, they don't
    // park to the page): a streak launches from above the top edge on a random lane
    // and falls on a diagonal. A staggered negative start-y keeps the initial batch
    // from all appearing at once. `r` carries the tail length.
    const spawnMeteor = (w: number, h: number): Particle => ({
      x: rnd() * w * 1.2 - w * 0.1,
      y: -40 - rnd() * h * 0.6,
      r: 58 + rnd() * 90,
      vx: 2.4 + rnd() * 2,
      vy: 5 + rnd() * 3.2,
      a: 0.5 + rnd() * 0.38, // bold at 100% (excluded from the seed-time alpha boost)
      life: 0,
      seed: 0,
    });

    // Warp streaks are the second VIEWPORT-locked effect: launched from the center
    // with a small starting radius that accelerates outward on a fixed angle.
    // `seed` carries the angle, `r`/`life` carry the previous/current radius so the
    // step function can draw a streak between the two without an extra field.
    const spawnWarp = (w: number, h: number): Particle => {
      const life = 4 + rnd() * Math.max(w, h) * 0.05;
      return { x: 0, y: 0, r: life, vx: 0, vy: 0, a: 0.3 + rnd() * 0.3, life, seed: rnd() * 6.283 };
    };

    const seed = (id: EffectId) => {
      const { w, h, docH } = sizeRef.current;
      const area = w * docH;
      const parts: Particle[] = [];
      const push = (n: number, make: () => Particle) => { for (let i = 0; i < n; i++) parts.push(make()); };
      // Densities + alphas tuned so each effect clearly READS on the page (Sam
      // couldn't see the faint originals). Opacity slider still scales this live.
      if (id === "snow")
        push(Math.round(area / 12000), () => ({ x: rnd() * w, y: rnd() * docH, r: 1 + rnd() * 2.6, vx: 0, vy: 0.25 + rnd() * 0.7, a: 0.24 + rnd() * 0.26, life: 0, seed: rnd() * 6.283 }));
      else if (id === "rain")
        push(Math.round(area / 9000), () => ({ x: rnd() * w, y: rnd() * docH, r: 7 + rnd() * 13, vx: 0, vy: 6 + rnd() * 7, a: 0.13 + rnd() * 0.16, life: 0, seed: 0 }));
      else if (id === "embers") {
        // Fire is a wall of flame across the bottom of the page, so its counts
        // scale with WIDTH, not the document area the drifting effects use.
        push(Math.round(w * 0.24), () => spawnFlame(w, docH, false));
        push(Math.round(w * 0.11), () => spawnFlame(w, docH, true));
      }
      else if (id === "stars")
        push(Math.round(area / 10000), () => ({ x: rnd() * w, y: rnd() * docH, r: 0.6 + rnd() * 1.7, vx: 0, vy: 0, a: 0.34 + rnd() * 0.4, life: 0, seed: rnd() * 6.283 }));
      else if (id === "bubbles")
        push(Math.round(area / 22000), () => ({ x: rnd() * w, y: rnd() * docH, r: 3 + rnd() * 9, vx: (rnd() - 0.5) * 0.15, vy: -(0.2 + rnd() * 0.5), a: 0.16 + rnd() * 0.16, life: 0, seed: rnd() * 6.283 }));
      else if (id === "aurora") {
        const vh = h;
        push(Math.max(3, Math.round((docH / vh) * 2.6)), () => ({ x: rnd() * w, y: rnd() * docH, r: Math.max(w, vh) * (0.32 + rnd() * 0.22), vx: (rnd() - 0.5) * 0.18, vy: (rnd() - 0.5) * 0.12, a: 0.10 + rnd() * 0.07, life: 0, seed: rnd() * 6.283 }));
      } else if (id === "mist") {
        const vh = h;
        push(Math.max(3, Math.round((docH / vh) * 2.4)), () => ({ x: rnd() * w, y: rnd() * docH, r: w * (0.34 + rnd() * 0.28), vx: (0.12 + rnd() * 0.2) * (rnd() < 0.5 ? -1 : 1), vy: 0, a: 0.09 + rnd() * 0.07, life: 0, seed: rnd() * 6.283 }));
      }
      // Wandering warm glow-motes that pulse in and out — life carries the pulse phase.
      else if (id === "fireflies")
        push(Math.round(area / 26000), () => ({ x: rnd() * w, y: rnd() * docH, r: 1 + rnd() * 1.6, vx: (rnd() - 0.5) * 0.4, vy: (rnd() - 0.5) * 0.4, a: 0.5 + rnd() * 0.4, life: rnd(), seed: rnd() * 6.283 }));
      // Falling petals that tumble: life = rotation angle, li = spin speed (± either way).
      else if (id === "petals")
        push(Math.round(area / 30000), () => ({ x: rnd() * w, y: rnd() * docH, r: 4 + rnd() * 5, vx: (rnd() - 0.5) * 0.5, vy: 0.5 + rnd() * 0.9, a: 0.12 + rnd() * 0.14, life: rnd() * 6.283, li: (rnd() - 0.5) * 0.05, seed: rnd() * 6.283 }));
      // Tumbling confetti bits: life = rotation angle, li = spin speed (± either way,
      // faster than a petal's) — thin rectangles, not ellipses, so they flip edge-on.
      else if (id === "confetti")
        push(Math.round(area / 20000), () => ({ x: rnd() * w, y: rnd() * docH, r: 3 + rnd() * 3, vx: (rnd() - 0.5) * 0.6, vy: 1 + rnd() * 1.6, a: 0.14 + rnd() * 0.16, life: rnd() * 6.283, li: (rnd() < 0.5 ? -1 : 1) * (0.04 + rnd() * 0.05), seed: rnd() * 6.283 }));
      // Slow-rising balloons: bigger and slower than bubbles, with a trailing string
      // drawn in the step function — seed carries the sway phase.
      else if (id === "balloons")
        push(Math.round(area / 42000), () => ({ x: rnd() * w, y: rnd() * docH, r: 8 + rnd() * 7, vx: (rnd() - 0.5) * 0.15, vy: -(0.3 + rnd() * 0.4), a: 0.10 + rnd() * 0.12, life: 0, seed: rnd() * 6.283 }));
      // A sparse handful, counted against the VIEWPORT (they don't park to the page).
      else if (id === "meteors")
        push(Math.max(2, Math.round((w * h) / 240000)), () => spawnMeteor(w, h));
      // Big soft out-of-focus discs drifting up — a brighter rim reads as defocused bokeh.
      else if (id === "bokeh")
        push(Math.round(area / 42000), () => ({ x: rnd() * w, y: rnd() * docH, r: 14 + rnd() * 34, vx: (rnd() - 0.5) * 0.1, vy: -(0.1 + rnd() * 0.3), a: 0.05 + rnd() * 0.07, life: 0, seed: rnd() * 6.283 }));
      // Drifting nodes that bounce off the page edges; near neighbours link with a faint line.
      else if (id === "network")
        push(Math.round(area / 40000), () => ({ x: rnd() * w, y: rnd() * docH, r: 1.4 + rnd() * 1.4, vx: (rnd() - 0.5) * 0.3, vy: (rnd() - 0.5) * 0.3, a: 0.34 + rnd() * 0.3, life: 0, seed: 0 }));
      // Expanding concentric rings that fade and respawn: life = progress 0..1, seed = max radius.
      else if (id === "ripples")
        push(Math.max(3, Math.round(area / 120000)), () => ({ x: rnd() * w, y: rnd() * docH, r: 0, vx: 0, vy: 0, a: 0.3 + rnd() * 0.2, life: rnd(), li: 0.004 + rnd() * 0.006, seed: 26 + rnd() * 54 }));
      // Fine Brownian motes — smaller, slower, no gravity, wandering omnidirectionally.
      else if (id === "dust")
        push(Math.round(area / 16000), () => ({ x: rnd() * w, y: rnd() * docH, r: 0.6 + rnd() * 1, vx: (rnd() - 0.5) * 0.06, vy: (rnd() - 0.5) * 0.06, a: 0.10 + rnd() * 0.12, life: 0, seed: rnd() * 6.283 }));
      // Popping 4-point star glints: life = pop phase 0..1, li = pop speed, seed unused (respawn picks a fresh spot).
      else if (id === "sparkle")
        push(Math.round(area / 40000), () => ({ x: rnd() * w, y: rnd() * docH, r: 3 + rnd() * 4, vx: 0, vy: 0, a: 0.5 + rnd() * 0.4, life: rnd(), li: 0.010 + rnd() * 0.010, seed: 0 }));
      // Hyperspace streaks — counted against the VIEWPORT, like meteors.
      else if (id === "warp")
        push(Math.max(3, Math.round((w * h) / 26000)), () => spawnWarp(w, h));
      // Falling code-rain glyphs: seed indexes MATRIX_GLYPHS, r doubles as font size.
      else if (id === "matrix")
        push(Math.round(area / 12000), () => ({ x: rnd() * w, y: rnd() * docH, r: 10 + rnd() * 3, vx: 0, vy: 2 + rnd() * 4, a: 0.16 + rnd() * 0.18, life: 0, seed: rnd() }));
      // 1–2 huge soft roaming lights on a slow Lissajous path across the viewport.
      else if (id === "spotlight")
        push(Math.min(2, Math.max(1, Math.round(w / 1400))), () => ({ x: 0, y: 0, r: Math.max(w, h) * 0.4, vx: 0, vy: 0, a: 0.05 + rnd() * 0.05, life: 0, seed: rnd() * 6.283 }));
      // Flowing horizontal sine lines: seed = phase offset, r = amplitude, vx = phase-drift speed.
      else if (id === "waves") {
        const vh = h;
        push(Math.max(4, Math.round((docH / vh) * 3)), () => ({ x: 0, y: rnd() * docH, r: 8 + rnd() * 18, vx: 0.4 + rnd() * 0.6, vy: 0, a: 0.14 + rnd() * 0.14, life: 0, seed: rnd() * 6.283 }));
      }
      // Slow galactic swirl about the viewport center: seed = angle, r = orbit radius
      // (inner orbits spin faster and slowly decay inward before respawning at the rim).
      else if (id === "vortex")
        push(Math.round(area / 22000), () => ({ x: 0, y: 0, r: 20 + rnd() * Math.max(w, h) * 0.5, vx: 0, vy: 0, a: 0.18 + rnd() * 0.16, life: 0, seed: rnd() * 6.283 }));
      // The opacity slider drives globalAlpha, which can only ever scale DOWN from a
      // particle's own alpha — so these alphas ARE the 100% / max look. Boost them here
      // so the slider's top reads as genuinely opaque, not the faint design value.
      // Additive effects (fire, fireflies, sparkle) blow out under a boost so they opt
      // out; meteors carry their bold alpha in spawnMeteor; dither boosts its own buffer alpha.
      if (id !== "embers" && id !== "fireflies" && id !== "meteors" && id !== "sparkle")
        for (const p of parts) p.a = Math.min(1, p.a * 1.8);
      partsRef.current = parts;
      seedForRef.current = id;
    };

    let t = 0;
    let prevId: EffectId | null = null;
    let ditherPainted = false;
    let ditherAt = 0;
    let grainPainted = false;
    let grainAt = 0;
    let sy = 0; // current scrollY, refreshed each frame
    let op = 1; // global alpha multiplier from the opacity slider, refreshed each frame
    const clear = () => ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h);
    const onScreen = (screenY: number, m: number) => screenY > -m && screenY < sizeRef.current.h + m;

    const stepSnow = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          p.x += Math.sin(t * 0.6 + p.seed) * 0.35;
          if (p.y > docH) p.y -= docH;
          if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 2)) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.arc(p.x, yy, p.r, 0, 6.283);
        ctx.fill();
      }
    };

    const stepRain = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      ctx.lineCap = "round";
      ctx.lineWidth = 1;
      for (const p of partsRef.current) {
        const dx = p.vy * 0.16;
        if (moving) {
          p.y += p.vy;
          p.x += dx;
          if (p.y > docH) { p.y -= docH; p.x = rnd() * w; }
          if (p.x > w + 5) p.x = -5;
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 4)) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${col},${p.a})`;
        ctx.moveTo(p.x, yy);
        ctx.lineTo(p.x - dx * 2, yy - p.r);
        ctx.stroke();
      }
    };

    const stepFire = (moving: boolean) => {
      const { w, h, docH } = sizeRef.current;
      // Optional tint (from the effect colour picker) overrides the natural fire
      // ramp — pick blue and you get blue fire — but keeps the glow + rise.
      const tint = colorRef.current ? colorRef.current.split(",").map(Number) : null;
      const baseY = docH - sy; // the document's bottom edge, in screen space
      const glowH = h * 0.5;
      ctx.globalCompositeOperation = "lighter"; // additive → hot cores blow out white
      // A heat glow rising from the bottom of the DOCUMENT — parked to the page,
      // so it only comes into view near the foot of the site. Flickers in
      // intensity like a real bed of coals. Skip entirely when it's off-screen.
      if (baseY > 0 && baseY - glowH < h) {
        const flick = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 5.1) * Math.sin(t * 2.7 + 1.3));
        const gb = tint ?? [255, 116, 34];
        const grad = ctx.createLinearGradient(0, baseY, 0, baseY - glowH);
        grad.addColorStop(0, `rgba(${gb[0]},${gb[1]},${gb[2]},${0.36 * flick})`);
        grad.addColorStop(0.42, `rgba(${gb[0]},${Math.round(gb[1] * 0.5)},${Math.round(gb[2] * 0.45)},${0.13 * flick})`);
        grad.addColorStop(1, `rgba(${gb[0]},${gb[1]},${gb[2]},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, baseY - glowH, w, glowH);
      }

      for (const p of partsRef.current) {
        if (moving) {
          p.life += p.li ?? 0.014;
          p.y += p.vy;
          // sway — wide for the big bodies, jittery for the sparks
          p.x += p.vx + Math.sin(t * (p.spark ? 3.4 : 1.7) + p.seed) * (p.spark ? 0.6 : 0.5 + p.r * 0.03);
          if (p.life >= 1) Object.assign(p, spawnFlame(w, docH, !!p.spark));
        }
        const yy = p.y - sy; // document-space → screen
        if (yy < -p.r || yy > h + p.r) continue; // cull when the foot-of-page fire is off-screen
        const L = p.life < 0 ? 0 : p.life > 1 ? 1 : p.life;
        const col = tint ?? (p.spark ? rampColor(FIRE_STOPS, L * 0.66) : rampColor(FIRE_STOPS, L));
        // Bodies burn brightest at the base and taper out fast; sparks stay hot
        // most of the climb then twinkle as they cool higher up.
        const alpha = p.spark
          ? p.a * Math.min(1, (1 - L) * 3) * (0.5 + 0.5 * Math.sin(t * 7 + p.seed))
          : p.a * (1 - L) * (1 - L);
        if (alpha <= 0.004) continue;
        const rr = p.spark ? p.r : p.r * (1 - L * 0.5); // flame narrows as it rises
        const rg = ctx.createRadialGradient(p.x, yy, 0, p.x, yy, rr);
        rg.addColorStop(0, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${alpha})`);
        rg.addColorStop(1, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(p.x, yy, rr, 0, 6.283);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const stepStars = () => {
      const col = ink();
      for (const p of partsRef.current) {
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 2)) continue;
        const tw = reduceRef.current ? 0.75 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.6 + p.seed));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a * tw})`;
        ctx.arc(p.x, yy, p.r, 0, 6.283);
        ctx.fill();
      }
    };

    const stepBubbles = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      ctx.lineWidth = 1;
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.7 + p.seed) * 0.2;
          if (p.y + p.r < 0) { p.y = docH + p.r; p.x = rnd() * w; }
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 2)) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${col},${p.a})`;
        ctx.arc(p.x, yy, p.r, 0, 6.283);
        ctx.stroke();
      }
    };

    const stepBlobs = (moving: boolean, squashY: number) => {
      const { w, h, docH } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        if (moving) {
          p.x += p.vx + Math.sin(t * 0.25 + p.seed) * 0.22;
          p.y += p.vy + Math.cos(t * 0.2 + p.seed) * 0.18;
          if (p.x < -p.r) p.x = w + p.r; else if (p.x > w + p.r) p.x = -p.r;
          if (p.y < -p.r) p.y = docH + p.r; else if (p.y > docH + p.r) p.y = -p.r;
        }
        const yy = p.y - sy;
        if (yy + p.r < 0 || yy - p.r > h) continue; // cull off-screen blobs
        ctx.save();
        ctx.translate(p.x, yy);
        if (squashY !== 1) ctx.scale(1, squashY);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
        g.addColorStop(0, `rgba(${col},${p.a})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }
    };

    const stepDither = () => {
      const dref = ditherRef.current;
      if (!dref) return;
      const { buf, iw, ih } = dref;
      const bctx = buf.getContext("2d");
      if (!bctx) return;
      const img = bctx.createImageData(iw, ih);
      const d = img.data;
      const tint = colorRef.current;
      const [cr, cg, cb] = tint ? tint.split(",").map(Number) : darkRef.current ? [255, 255, 255] : [20, 20, 20];
      const oy = sy / 5; // park the field to the document
      for (let y = 0; y < ih; y++) {
        const dy = y + oy;
        for (let x = 0; x < iw; x++) {
          const v =
            0.5 +
            0.28 * Math.sin(x / 14 + t * 0.6) +
            0.22 * Math.sin(dy / 18 - t * 0.4) +
            0.14 * Math.sin((x + dy) / 22 + t * 0.3);
          const threshold = BAYER4[(y & 3) * 4 + (x & 3)];
          const i = (y * iw + x) * 4;
          d[i] = cr;
          d[i + 1] = cg;
          d[i + 2] = cb;
          d[i + 3] = v > threshold ? 72 : 0; // bold at 100% (globalAlpha only scales this down)
        }
      }
      bctx.putImageData(img, 0, 0);
      const { w, h } = sizeRef.current;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, iw, ih, 0, 0, w, h);
    };

    // Film-grain static — a full VIEWPORT field, not particles, so it never seeds
    // (see the `id !== "grain"` guard in frame()). `regen` is false on the frames
    // between throttled re-rolls: the buffer still holds last roll's noise, so we
    // just re-blit it (needed because `clear()` wipes the main canvas every frame).
    const stepGrain = (regen: boolean) => {
      const gref = grainRef.current;
      if (!gref) return;
      const { buf, iw, ih } = gref;
      if (regen) {
        const gctx = buf.getContext("2d");
        if (gctx) {
          const img = gctx.createImageData(iw, ih);
          const d = img.data;
          const tint = colorRef.current;
          const [cr, cg, cb] = tint ? tint.split(",").map(Number) : darkRef.current ? [255, 255, 255] : [20, 20, 20];
          for (let i = 0; i < iw * ih; i++) {
            const j = i * 4;
            d[j] = cr;
            d[j + 1] = cg;
            d[j + 2] = cb;
            d[j + 3] = rnd() < 0.5 ? 0 : 28 + rnd() * 12; // subtle — half the pixels stay bare
          }
          gctx.putImageData(img, 0, 0);
        }
      }
      const { w, h } = sizeRef.current;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, iw, ih, 0, 0, w, h);
    };

    const stepFireflies = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      // Warm by default (a firefly IS a yellow-green glow) — like embers keep their
      // heat; a custom tint overrides it. Additive so the glows bloom where they cross.
      const tint = colorRef.current ? colorRef.current.split(",").map(Number) : [188, 210, 120];
      ctx.globalCompositeOperation = "lighter";
      for (const p of partsRef.current) {
        if (moving) {
          p.x += p.vx + Math.sin(t * 0.7 + p.seed) * 0.3;
          p.y += p.vy + Math.cos(t * 0.5 + p.seed * 1.3) * 0.3;
          if (p.x < -6) p.x = w + 6; else if (p.x > w + 6) p.x = -6;
          if (p.y < 0) p.y += docH; else if (p.y > docH) p.y -= docH;
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 8)) continue;
        const pulse = reduceRef.current ? 0.7 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.3 + p.seed));
        const alpha = p.a * pulse;
        if (alpha <= 0.004) continue;
        const rr = p.r * 3.2;
        const g = ctx.createRadialGradient(p.x, yy, 0, p.x, yy, rr);
        g.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},${alpha})`);
        g.addColorStop(1, `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, yy, rr, 0, 6.283);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const stepPetals = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.8 + p.seed) * 0.8; // wide swaying fall
          p.life += p.li ?? 0.03; // tumble
          if (p.y - p.r > docH) { p.y = -p.r; p.x = rnd() * w; }
          if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 4)) continue;
        ctx.save();
        ctx.translate(p.x, yy);
        ctx.rotate(p.life);
        // The petal breathes edge-on as it tumbles, so it flutters instead of spinning flat.
        ctx.scale(1, 0.35 + 0.35 * Math.abs(Math.sin(t * 1.1 + p.seed)));
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.62, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }
    };

    const stepConfetti = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.8 + p.seed) * 0.7;
          p.life += p.li ?? 0.06; // tumble
          if (p.y - p.r > docH) { p.y = -p.r; p.x = rnd() * w; }
          if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 4)) continue;
        // Edge-on tumble: the flake's height is squashed by an independent sine so
        // it reads as a flipping rectangle, not a spinning-flat one (petals use the
        // same trick with an ellipse).
        const flutter = 0.3 + 0.5 * Math.abs(Math.sin(t + p.seed));
        ctx.save();
        ctx.translate(p.x, yy);
        ctx.rotate(p.life);
        ctx.scale(1, flutter);
        ctx.fillStyle = `rgba(${col},${p.a})`;
        const len = p.r * 2, th = Math.max(1.3, p.r * 0.4);
        ctx.fillRect(-len / 2, -th / 2, len, th);
        ctx.restore();
      }
    };

    const stepBalloons = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      ctx.lineWidth = 1;
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.5 + p.seed) * 0.25;
          if (p.y + p.r < 0) { p.y = docH + p.r; p.x = rnd() * w; }
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r * 2 + 10)) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.ellipse(p.x, yy, p.r * 0.8, p.r, 0, 0, 6.283);
        ctx.fill();
        // A thin string trailing below, with a slight sine curve.
        const sway = Math.sin(t * 0.9 + p.seed) * 2;
        ctx.strokeStyle = `rgba(${col},${p.a * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(p.x, yy + p.r);
        ctx.quadraticCurveTo(p.x + sway, yy + p.r * 1.6, p.x + sway * 0.5, yy + p.r * 2.2);
        ctx.stroke();
      }
    };

    const stepMeteors = (moving: boolean) => {
      const { w, h } = sizeRef.current;
      const col = ink();
      ctx.lineCap = "round";
      for (const p of partsRef.current) {
        if (moving) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > h + 60 || p.x > w + 80) Object.assign(p, spawnMeteor(w, h));
        }
        // Viewport-locked: draw at p.y directly, never `y - sy` — meteors cross the glass.
        if (p.y < -p.r || p.y > h + p.r) continue;
        const spd = Math.hypot(p.vx, p.vy) || 1;
        const tx = p.x - (p.vx / spd) * p.r;
        const ty = p.y - (p.vy / spd) * p.r;
        const grad = ctx.createLinearGradient(p.x, p.y, tx, ty);
        grad.addColorStop(0, `rgba(${col},${p.a})`);
        grad.addColorStop(1, `rgba(${col},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.arc(p.x, p.y, 1.4, 0, 6.283);
        ctx.fill();
      }
    };

    const stepBokeh = (moving: boolean) => {
      const { w, h, docH } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        if (moving) {
          p.x += p.vx + Math.sin(t * 0.3 + p.seed) * 0.15;
          p.y += p.vy;
          if (p.y + p.r < 0) { p.y = docH + p.r; p.x = rnd() * w; }
          if (p.x < -p.r) p.x = w + p.r; else if (p.x > w + p.r) p.x = -p.r;
        }
        const yy = p.y - sy;
        if (yy + p.r < 0 || yy - p.r > h) continue;
        const g = ctx.createRadialGradient(p.x, yy, p.r * 0.35, p.x, yy, p.r);
        g.addColorStop(0, `rgba(${col},${p.a * 0.45})`);
        g.addColorStop(0.72, `rgba(${col},${p.a})`); // brighter rim = out-of-focus disc
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, yy, p.r, 0, 6.283);
        ctx.fill();
      }
    };

    const stepNetwork = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      // Move + bounce off the page bounds, then collect only the on-screen nodes so the
      // O(n²) link pass stays a screenful of work no matter how tall the document is.
      // `li` stashes each node's screen-Y for the draw below.
      const vis: Particle[] = [];
      for (const p of partsRef.current) {
        if (moving) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) { p.x = 0; p.vx = -p.vx; } else if (p.x > w) { p.x = w; p.vx = -p.vx; }
          if (p.y < 0) { p.y = 0; p.vy = -p.vy; } else if (p.y > docH) { p.y = docH; p.vy = -p.vy; }
        }
        const yy = p.y - sy;
        if (onScreen(yy, 40)) { p.li = yy; vis.push(p); }
      }
      const TH = 118, TH2 = TH * TH;
      ctx.lineWidth = 1;
      for (let i = 0; i < vis.length; i++) {
        const a2 = vis[i];
        for (let j = i + 1; j < vis.length; j++) {
          const b2 = vis[j];
          const dx = a2.x - b2.x, dy = (a2.li ?? 0) - (b2.li ?? 0);
          const d2 = dx * dx + dy * dy;
          if (d2 > TH2) continue;
          const al = (1 - Math.sqrt(d2) / TH) * 0.5;
          ctx.strokeStyle = `rgba(${col},${al})`;
          ctx.beginPath();
          ctx.moveTo(a2.x, a2.li ?? 0);
          ctx.lineTo(b2.x, b2.li ?? 0);
          ctx.stroke();
        }
      }
      for (const p of vis) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.arc(p.x, p.li ?? 0, p.r, 0, 6.283);
        ctx.fill();
      }
    };

    const stepRipples = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      ctx.lineWidth = 1.4;
      for (const p of partsRef.current) {
        if (moving) {
          p.life += p.li ?? 0.006;
          if (p.life >= 1) { p.life = 0; p.x = rnd() * w; p.y = rnd() * docH; p.seed = 26 + rnd() * 54; p.li = 0.004 + rnd() * 0.006; }
        }
        const yy = p.y - sy;
        const rr = p.life * p.seed; // seed = max radius
        if (!onScreen(yy, rr + 2)) continue;
        const al = p.a * (1 - p.life);
        if (al <= 0.003) continue;
        ctx.strokeStyle = `rgba(${col},${al})`;
        ctx.beginPath();
        ctx.arc(p.x, yy, rr, 0, 6.283);
        ctx.stroke();
      }
    };

    const stepDust = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        if (moving) {
          p.x += p.vx + Math.sin(t * 0.5 + p.seed) * 0.25;
          p.y += p.vy + Math.cos(t * 0.4 + p.seed * 1.7) * 0.25;
          if (p.x < -2) p.x = w + 2; else if (p.x > w + 2) p.x = -2;
          if (p.y < -2) p.y = docH + 2; else if (p.y > docH + 2) p.y = -2;
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 2)) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.arc(p.x, yy, p.r, 0, 6.283);
        ctx.fill();
      }
    };

    const stepSparkle = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      ctx.globalCompositeOperation = "lighter"; // additive glints — excluded from the seed-time boost
      ctx.lineCap = "round";
      for (const p of partsRef.current) {
        if (moving) {
          p.life += p.li ?? 0.014;
          if (p.life >= 1) { p.life = 0; p.x = rnd() * w; p.y = rnd() * docH; }
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r * 2 + 4)) continue;
        const phase = p.life < 0 ? 0 : p.life > 1 ? 1 : p.life;
        const s = Math.sin(phase * Math.PI); // fades in then out across the pop
        const al = p.a * s;
        if (al <= 0.004) continue;
        const len = p.r * s;
        ctx.strokeStyle = `rgba(${col},${al})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - len, yy);
        ctx.lineTo(p.x + len, yy);
        ctx.moveTo(p.x, yy - len);
        ctx.lineTo(p.x, yy + len);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    // Viewport-locked, like meteors: streaks radiate from the screen center and
    // accelerate outward, brightening and thickening as they near the edge.
    const stepWarp = (moving: boolean) => {
      const { w, h } = sizeRef.current;
      const col = ink();
      const cx = w / 2, cy = h / 2;
      const diag = Math.hypot(w, h) * 0.5 + 20;
      ctx.lineCap = "round";
      for (const p of partsRef.current) {
        const prevR = p.r;
        if (moving) {
          p.r = p.life; // last frame's radius becomes this frame's streak start
          p.life = p.life * 1.06 + 0.4; // accelerating outward
          if (p.life > diag) Object.assign(p, spawnWarp(w, h));
        }
        const r0 = moving ? prevR : p.life * 0.94;
        const r1 = p.life;
        const cosA = Math.cos(p.seed), sinA = Math.sin(p.seed);
        const f = Math.min(1, r1 / diag); // 0 near center → 1 near the edge
        const al = p.a * f;
        if (al <= 0.004) continue;
        ctx.strokeStyle = `rgba(${col},${al})`;
        ctx.lineWidth = 0.6 + f * 1.8;
        ctx.beginPath();
        ctx.moveTo(cx + cosA * r0, cy + sinA * r0);
        ctx.lineTo(cx + cosA * r1, cy + sinA * r1);
        ctx.stroke();
      }
    };

    const stepMatrix = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      const col = ink();
      const len = MATRIX_GLYPHS.length;
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          if (p.y > docH) { p.y = -10; p.x = rnd() * w; p.seed = rnd(); }
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 4)) continue;
        const ch = MATRIX_GLYPHS[Math.min(len - 1, (p.seed * len) | 0)];
        ctx.font = `${p.r}px monospace`;
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.fillText(ch, p.x, yy);
      }
    };

    // Roaming soft lights on a Lissajous path — driven entirely by the frozen-under-
    // reduced-motion `t`, so no per-particle state to advance (like stepStars).
    const stepSpotlight = () => {
      const { w, h } = sizeRef.current;
      const col = ink();
      for (const p of partsRef.current) {
        const cx = w * (0.5 + 0.4 * Math.sin(t * 0.13 + p.seed));
        const cy = h * (0.5 + 0.4 * Math.cos(t * 0.11 + p.seed * 1.3));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, p.r);
        g.addColorStop(0, `rgba(${col},${p.a})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, p.r, 0, 6.283);
        ctx.fill();
      }
    };

    // Also driven by the frozen `t` under reduced motion — no per-particle position.
    const stepWaves = () => {
      const { w } = sizeRef.current;
      const col = ink();
      const wavelength = 90;
      ctx.lineWidth = 1.2;
      for (const p of partsRef.current) {
        const baseY = p.y - sy;
        if (!onScreen(baseY, p.r + 4)) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${col},${p.a})`;
        for (let x = 0; x <= w; x += 8) {
          const yy = baseY + p.r * Math.sin(x / wavelength + t * p.vx + p.seed);
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    };

    const stepVortex = (moving: boolean) => {
      const { w, h } = sizeRef.current;
      const col = ink();
      const cx = w / 2, cy = h / 2;
      const maxR = Math.max(w, h) * 0.5;
      for (const p of partsRef.current) {
        if (moving) {
          p.seed += 0.3 / (0.5 + p.r * 0.01); // inner orbits spin faster
          p.r -= 0.15; // slow inward decay
          if (p.r < 8) { p.r = maxR; p.seed = rnd() * 6.283; }
        }
        const x = cx + Math.cos(p.seed) * p.r;
        const y = cy + Math.sin(p.seed) * p.r;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${p.a})`;
        ctx.arc(x, y, 0.8 + (p.r / maxR), 0, 6.283);
        ctx.fill();
      }
    };

    let lastFrameAt = 0;
    const frame = (now: number) => {
      const id = effRef.current;
      // Do not keep a 60fps canvas loop alive while the effects picker is off.
      // Selecting an effect re-runs this effect and starts the loop again.
      if (!id) {
        raf = 0;
        return;
      }
      sy = hostRef.current ? hostRef.current.scrollTop : window.scrollY || window.pageYOffset || 0;
      op = Math.max(0, Math.min(1, opacityRef.current ?? 1));
      clear();
      if (id !== prevId) { ditherPainted = false; grainPainted = false; prevId = id; }
      if (id) {
        const moving = !reduceRef.current;
        const dt = lastFrameAt ? Math.min((now - lastFrameAt) / 1000, 0.05) : 0;
        lastFrameAt = now;
        if (moving) t += dt;
        if (id !== "dither" && id !== "grain" && seedForRef.current !== id) seed(id);
        // One global alpha multiplier scales every effect's draws live (the slider);
        // drawImage (dither) respects it too. Reset after so nothing else inherits it.
        ctx.globalAlpha = op;
        if (id === "snow") stepSnow(moving);
        else if (id === "rain") stepRain(moving);
        else if (id === "embers") stepFire(moving);
        else if (id === "stars") stepStars();
        else if (id === "bubbles") stepBubbles(moving);
        else if (id === "aurora") stepBlobs(moving, 1);
        else if (id === "mist") stepBlobs(moving, 0.32);
        else if (id === "fireflies") stepFireflies(moving);
        else if (id === "petals") stepPetals(moving);
        else if (id === "confetti") stepConfetti(moving);
        else if (id === "balloons") stepBalloons(moving);
        else if (id === "meteors") stepMeteors(moving);
        else if (id === "bokeh") stepBokeh(moving);
        else if (id === "network") stepNetwork(moving);
        else if (id === "ripples") stepRipples(moving);
        else if (id === "dust") stepDust(moving);
        else if (id === "sparkle") stepSparkle(moving);
        else if (id === "warp") stepWarp(moving);
        else if (id === "matrix") stepMatrix(moving);
        else if (id === "spotlight") stepSpotlight();
        else if (id === "waves") stepWaves();
        else if (id === "vortex") stepVortex(moving);
        else if (id === "dither") {
          // Recompute the field on a throttle OR whenever the scroll moved it; blit
          // the cached buffer otherwise. Scroll must repaint so the parked look holds.
          if (!ditherPainted || (moving && t - ditherAt > 0.05)) {
            stepDither();
            ditherPainted = true;
            ditherAt = t;
          } else {
            stepDither(); // cheap enough; keeps it parked on scroll under reduced-motion
          }
        } else if (id === "grain") {
          const regen = !grainPainted || (moving && t - grainAt > 0.05);
          if (regen) { grainPainted = true; grainAt = t; }
          stepGrain(regen);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    let raf = requestAnimationFrame(frame);

    const onVis = () => {
      // rAF ids are always nonzero, so 0 marks "loop stopped". Only restart when it
      // is actually stopped, or a spurious visible-event spawns a second loop that
      // runs alongside the first — doubling the animation speed and CPU.
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // Re-run when the scroll host changes: the canvas re-parents (new node/ctx),
    // so re-attach the loop, re-measure, and reseed for the new scroller's height.
  }, [mounted, host, effect]);

  useEffect(() => {
    seedForRef.current = null;
  }, [effect, host]);

  if (!mounted) return null;
  // Portal into whatever owns the scroll — an open post overlay, or (for the page)
  // our <html>-level container `fxRoot`, so the canvas escapes the zoomed/width-frozen
  // <body> and `fixed inset-0` covers the true viewport at every width. `-z-10` still
  // sits above <html>'s background colour but below the transparent body's content, so
  // effects show on the page AND inside posts. Wait for fxRoot before the page portal.
  const target = host ?? fxRoot;
  if (!target) return null;
  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: effect ? 1 : 0, transition: reduce ? "none" : "opacity 500ms cubic-bezier(0.23,1,0.32,1)" }}
    />,
    target,
  );
}
