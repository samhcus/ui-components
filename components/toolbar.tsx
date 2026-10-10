"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useScrollHost } from "@/hooks/useScrollHost";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "motion/react";
import { TextAa, Palette, ArrowsCounterClockwise, X, Eraser, Trash, ArrowUUpLeft, ArrowUUpRight, Moon, Sun, PencilSimple, Sparkle, Snowflake, CloudRain, Flame, Waves, DotsNine, Star, CirclesThree, Cloud, House, SunDim, Flower, Meteor, Aperture, Graph, Broadcast, Wind, Asterisk, Rocket, Binary, Flashlight, WaveSine, Spiral, DiceFive, CaretLeft, Confetti, Balloon, Television, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { CatCursor } from "@/components/cat-cursor";
import { CatMark } from "@/components/brand/cat-mark";
import { notify } from "@/components/notification";
import { Tip } from "@/components/ui/tooltip";
import { BackgroundEffects, EFFECTS, type EffectId } from "@/components/background-effects";
import { playSound, getSoundEnabled, setSoundEnabled, subscribeSoundPreference } from "@/lib/ui-sound";
import { useSiteSounds } from "@/hooks/useSiteSounds";
import { ToolbarPanel } from "@/components/ui/toolbar-panel";
import { cn } from "@/lib/utils";

/* ── colour theory ─────────────────────────────────────────────────────── */
type RGB = [number, number, number];
function hsvToRgb(h: number, s: number, v: number): RGB {
  const c = v * s; const hp = (((h % 360) + 360) % 360) / 60; const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g] = [c, x]; else if (hp < 2) [r, g] = [x, c]; else if (hp < 3) [g, b] = [c, x];
  else if (hp < 4) [g, b] = [x, c]; else if (hp < 5) [r, b] = [x, c]; else [r, b] = [c, x];
  const m = v - c; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s; const hp = (((h % 360) + 360) % 360) / 60; const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g] = [c, x]; else if (hp < 2) [r, g] = [x, c]; else if (hp < 3) [g, b] = [c, x];
  else if (hp < 4) [g, b] = [x, c]; else if (hp < 5) [r, b] = [x, c]; else [r, b] = [c, x];
  const m = l - c / 2; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function relLum([r, g, b]: RGB): number {
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
function legibleInk(bg: RGB, hue: number, satFrac: number): RGB {
  const bgL = relLum(bg); const wantDark = bgL > 0.18;
  const inkSat = Math.min(satFrac, wantDark ? 0.55 : 0.42);
  const start = wantDark ? 0.26 : 0.9; const end = wantDark ? 0.05 : 1; const step = wantDark ? -0.02 : 0.02;
  for (let l = start; wantDark ? l >= end : l <= end; l += step) {
    const ink = hslToRgb(hue, inkSat, l);
    if (contrast(relLum(ink), bgL) >= 4.5) return ink;
  }
  return wantDark ? [17, 17, 17] : [245, 245, 244];
}
const rgbStr = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
const mix = (a: RGB, b: RGB, t: number): RGB =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round) as RGB;
const TINT = [
  ["--card", 0.06], ["--card-foreground", "ink"], ["--popover", 0.08], ["--popover-foreground", "ink"],
  ["--secondary", 0.09], ["--secondary-foreground", "ink"], ["--muted", 0.09], ["--accent", 0.1],
  ["--accent-foreground", "ink"], ["--border", 0.16], ["--input", 0.16], ["--primary", "ink"], ["--primary-foreground", "bg"],
] as const;
const COLOR_VARS = ["--background", "--foreground", "--muted-foreground", "--ring", ...TINT.map((t) => t[0])];
// localStorage key for the persisted site colour (mode + HSV) so a custom colour
// survives a full reload / hard navigation instead of resetting to the theme default.
const COLOR_KEY = "mh-color";
// Separate persisted record for the text/ink colour (font panel), independent of bg.
const TEXT_COLOR_KEY = "mh-text-color";
const SV_GRAD = (hueColor: string) => `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`;
const HUE_BAR = "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)";
// Thickness-slider track: a wedge CALIBRATED to the real pen scale. Its height grows
// linearly from PEN_MIN (1px) at the far left to PEN_MAX (20px) at the far right,
// centred in a 24px box, so the wedge's thickness under the nub is literally the pen's
// dot size at that spot — and the round nub (sized to the live weight) sits inscribed
// in it. What you see is exactly what you draw.
const WEDGE_BG = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='24' preserveAspectRatio='none'><path d='M0 11.5 L116 2.5 A3 3 0 0 1 116 21.5 L0 12.5 Z' fill='rgba(130,130,130,0.55)'/></svg>"
)}")`;

/* ── draw ──────────────────────────────────────────────────────────────── */
type SPt = { x: number; y: number; w: number };
type Stroke = { erase: boolean; color: string; alpha: number; pts: SPt[] };
const mid = (a: SPt, b: SPt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const BASE_W = 4;
const ERASER_W = 26;

const markerCursor = (color: string) => {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24'><g transform='rotate(-45 12 12)'>` +
    `<path d='M3.4 10.4 6.6 9v6l-3.2-1.4v-3.2Z' fill='${color}'/>` +
    `<rect x='6.6' y='8.6' width='9' height='6.8' rx='1.4' fill='#565A61'/>` +
    `<rect x='6.6' y='8.6' width='9' height='2' rx='1.4' fill='#6E727A'/>` +
    `<rect x='6.6' y='8.6' width='1.5' height='6.8' fill='${color}'/>` +
    `<path d='M15.6 8.6h1.9a1.5 1.5 0 0 1 1.5 1.5v3.8a1.5 1.5 0 0 1-1.5 1.5h-1.9V8.6Z' fill='${color}'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 7 22, crosshair`;
};
const ERASER_CURSOR = (() => {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='11' fill='rgba(160,160,160,0.2)' stroke='#8A8A8A' stroke-width='1.5'/></svg>";
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 13 13, cell`;
})();

const FONTS: (string | null)[] = [
  null,
  "var(--font-nunito)",
  "var(--font-space-grotesk)",
  "var(--font-instrument-serif)",
  "var(--font-lora)",
  "var(--font-geist-mono)",
  "var(--font-fraunces)",
  "var(--font-bricolage)",
  "var(--font-space-mono)",
  "var(--font-playfair)",
  "var(--font-dm-sans)",
  "var(--font-sora)",
  "var(--font-ibm-plex-mono)",
  "var(--font-newsreader)",
];
const FONT_NAMES = ["Inter", "Nunito", "Space Grotesk", "Instrument Serif", "Lora", "Geist Mono", "Fraunces", "Bricolage", "Space Mono", "Playfair Display", "DM Sans", "Sora", "IBM Plex Mono", "Newsreader"];
// Per-font advance-width normalisation holds the fixed desktop and mobile canvases
// still across a swap. The mono faces get the same optical scale as Inter instead
// of being shrunk to fit; their compensating tracking preserves the line advance,
// so text does not re-wrap and move a panel or section.
const FONT_ADJUST: (string | null)[] = [
  null,
  "ch-width 0.64", // Nunito
  "ch-width 0.64", // Space Grotesk
  "ch-width 0.58", // Instrument Serif — narrow glyphs, needs a touch less shrink
  "ch-width 0.64", // Lora
  "ch-width 0.60", // Geist Mono — Inter-scale glyphs, width is handled by tracking below
  "ch-width 0.64", // Fraunces
  "ch-width 0.64", // Bricolage
  "ch-width 0.60", // Space Mono — Inter-scale glyphs, width is handled by tracking below
  "ch-width 0.62", // Playfair Display — measured: 0.64 drifts +4px, 0.62 holds layout exactly
  "ch-width 0.64", // DM Sans — measured zero drift
  "ch-width 0.64", // Sora — measured zero drift
  "ch-width 0.60", // IBM Plex Mono — Inter-scale glyphs, width is handled by tracking below
  "ch-width 0.62", // Newsreader — measured: 0.64 drifts +4px, ≤0.63 holds layout exactly
];
// `font-size-adjust` changes each mono glyph's visible scale; close its additional
// advance with tracking so the original 0.48ch layout measure remains intact.
const FONT_TRACKING: (string | null)[] = [
  null, null, null, null, null,
  "-0.125em", // Geist Mono: 0.60ch visual scale, tracked tight to preserve the old 0.48ch layout measure
  null, null,
  "-0.125em", // Space Mono
  null, null, null,
  "-0.125em", // IBM Plex Mono
  null,
];
const PEN_MIN = 1;
const PEN_MAX = 20;

// A dice roll should feel like it is travelling through distinct looks, not
// repeatedly sampling the same few choices. Shuffle each finite control into a
// bag and move the current value out of the first slot, so the next hop always
// visibly changes the site.
function shuffledIndices(length: number, current: number) {
  const values = Array.from({ length }, (_, i) => i);
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  const currentAt = values.indexOf(current);
  if (currentAt > 0) [values[0], values[currentAt]] = [values[currentAt], values[0]];
  if (values[0] === current && values.length > 1) [values[0], values[1]] = [values[1], values[0]];
  return values;
}

// Golden-angle spacing keeps successive hues distributed around the wheel even
// before the small random offset is applied.
const ROLL_HUES = Array.from({ length: 18 }, (_, i) => (i * 137.508) % 360);

/* ── dynamic-island chrome (theme-aware neutral surface, bold glyphs, squircle) ──
   Every control is ONE unified rounded SQUARE — rounded-lg (12px) on the 36px
   button, matching the draw/effect tools. (rounded-xl = 18px read as a circle on a
   36px button, which is exactly the round hover/active highlight Sam rejected.)
   Emil pass: house ease-out on the hover/press transition (#4), a subtle
   active:scale-[0.96] press (#1), no focus ring — the accent fill IS the feedback. */
const ICON = 19; // bolder + larger than before; pair with weight="bold"
const BTN =
  "flex h-9 w-9 max-[360px]:h-8 max-[360px]:w-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:hover:bg-muted/70 [@media(hover:hover)]:hover:text-foreground active:scale-[0.96] [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out";
const BTN_ON = "!text-foreground bg-muted/80";
const TOOL =
  "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:hover:bg-muted/70 [@media(hover:hover)]:hover:text-foreground active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none";

// One monochrome glyph per ambient background effect (Sparkle = the whole system
// at rest). Sized inline where used.
const EFFECT_ICON: Record<EffectId, typeof Snowflake> = {
  snow: Snowflake,
  rain: CloudRain,
  embers: Flame,
  aurora: Waves,
  dither: DotsNine,
  stars: Star,
  bubbles: CirclesThree,
  mist: Cloud,
  fireflies: SunDim,
  petals: Flower,
  meteors: Meteor,
  bokeh: Aperture,
  network: Graph,
  ripples: Broadcast,
  dust: Wind,
  sparkle: Asterisk,
  warp: Rocket,
  matrix: Binary,
  spotlight: Flashlight,
  waves: WaveSine,
  vortex: Spiral,
  confetti: Confetti,
  balloons: Balloon,
  grain: Television,
};

export function Toolbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Respect reduced-motion: collapse every fly-out/label transition to instant.
  const reduce = useReducedMotion();
  useSiteSounds();
  const soundOn = useSyncExternalStore(subscribeSoundPreference, getSoundEnabled, () => false);
  // In draw mode the island fades back so you can draw behind it; it relights
  // when the marker moves over it (geometry check below, since the canvas — not
  // the island — is receiving the pointer while dimmed).
  const [islandLit, setIslandLit] = useState(true);
  // The island rests dimmed and lifts to full opacity while engaged — hovered on a
  // fine pointer, or with a panel open (which is how touch keeps it lit: a tap
  // fires pointerenter, and any opened panel holds it up until you tap away).
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Touch has no hover-move to relight the island, so drawing dims/collapses it and
  // a tap relights it. See the draw effect and the island's pointer handlers.
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches), []);
  // A cat that chases the cursor, toggled from the island.
  const [catOn, setCatOn] = useState(false);
  // Faint ambient background effect (snow/rain/embers/aurora/dither) + its picker.
  const [effect, setEffect] = useState<EffectId | null>(null);
  const [effectsOpen, setEffectsOpen] = useState(false);
  // Optional tint for the effect particles; neutral (theme-adaptive) until touched.
  const [fxHue, setFxHue] = useState(210);
  const [fxSat, setFxSat] = useState(0.65);
  const [fxVal, setFxVal] = useState(0.9);
  const [fxTinted, setFxTinted] = useState(false);
  const [fxOpacity, setFxOpacity] = useState(1);
  const pathname = usePathname();
  const router = useRouter();
  // On a standalone route (/components, /sandbox, …) the island grows a Home button
  // that returns to the home page. In-place post overlays keep pathname "/" and have
  // their own close controls, so it only shows on real routes away from home.
  const offHome = pathname !== "/";

  /* draw */
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penHue, setPenHue] = useState(0);
  const [penSat, setPenSat] = useState(0.78);
  const [penVal, setPenVal] = useState(0.92);
  const [penWidth, setPenWidth] = useState(BASE_W);
  const [penAlpha, setPenAlpha] = useState(1);
  const [histVer, setHistVer] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokingRef = useRef(false);
  const curRef = useRef<Stroke | null>(null);
  const rectRef = useRef({ left: 0, top: 0 });
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  // Each scroll surface (the document, or an open post overlay) keeps its OWN ink,
  // so strokes drawn on a post pin to that post and never bleed onto the page.
  const host = useScrollHost();
  const strokeStore = useRef<Map<HTMLElement | null, { strokes: Stroke[]; redo: Stroke[] }>>(new Map());
  const prevHostRef = useRef<HTMLElement | null>(null);
  const toolRef = useRef(tool); toolRef.current = tool;
  const penRGB = hsvToRgb(penHue, penSat, penVal);
  const penColorHex = rgbStr(penRGB); // opaque — strokes render at full opacity, alpha is applied once when composited
  const penHexRef = useRef(penColorHex); penHexRef.current = penColorHex;
  const penAlphaRef = useRef(penAlpha); penAlphaRef.current = penAlpha;
  const penWidthRef = useRef(penWidth); penWidthRef.current = penWidth;
  // Two offscreen layers make translucent ink smooth. `baked` holds every finished
  // stroke already flattened at its own alpha; `scratch` renders the in-progress
  // stroke at FULL opacity. A translucent stroke is composited as ONE layer, not
  // segment-by-segment — so the overlaps at each join no longer stack alpha into
  // the dark, choppy beads you'd get painting rgba() strokes straight to canvas.
  const bakedRef = useRef<HTMLCanvasElement | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const curAlphaRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctxRef.current = ctx;

    // The canvas has just (re)parented into the current scroll surface. Stash the
    // old surface's ink and load this one's, so each keeps its own drawing.
    if (prevHostRef.current !== host) {
      strokeStore.current.set(prevHostRef.current, { strokes: strokesRef.current, redo: redoRef.current });
      const next = strokeStore.current.get(host) ?? { strokes: [], redo: [] };
      strokesRef.current = next.strokes; redoRef.current = next.redo;
      prevHostRef.current = host;
      setHistVer((v) => v + 1);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      // Size to whatever is scrolling: the open post overlay, or the document.
      const w = host ? host.clientWidth : window.innerWidth;
      // A post can detach before its ResizeObserver is disconnected. Keep the
      // last valid bitmap until the canvas moves to the next scroll surface.
      if (w <= 0 || (host && !host.isConnected)) return;
      // The canvas is absolutely positioned, so its own height counts toward the
      // scroller's scrollHeight. Collapse it before measuring, or once it grows tall
      // it pins scrollHeight to that height forever and never shrinks back — a big
      // empty scroll gap. Measure true content with the canvas at zero height first.
      const previousHeight = canvas.style.height;
      canvas.style.height = "0px";
      const h = host
        ? Math.max(host.scrollHeight, host.clientHeight)
        : Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
      if (cw <= 0 || ch <= 0) { canvas.style.height = previousHeight; return; }
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      if (canvas.width === cw && canvas.height === ch) { redraw(); return; }
      canvas.width = cw; canvas.height = ch;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ensureLayers(cw, ch, dpr); // keep the baked/scratch layers in lockstep with the canvas
      // Repaint from the vector strokes, not a bitmap resample. Strokes are stored
      // in CSS-px content coordinates, so they land exactly where they were drawn
      // regardless of the new canvas size — no drift, no resampling blur.
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize); ro.observe(host ?? document.body);
    return () => { window.removeEventListener("resize", resize); ro.disconnect(); };
  }, [host, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drawings are page-scoped: a real route change wipes the canvas so a sketch on
  // the home page never bleeds onto /components, /writing, etc. In-place overlays
  // (writing/design full-page views) don't change the pathname, so they keep it.
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) { firstPath.current = false; return; }
    strokesRef.current = []; redoRef.current = [];
    strokeStore.current.clear(); // every surface's ink resets on a real navigation
    clearBitmap(); setHistVer((v) => v + 1);
    endStroke(); setDrawing(false);
  }, [pathname]);

  const ensureLayers = (cw: number, ch: number, dpr: number) => {
    for (const ref of [bakedRef, scratchRef]) {
      let c = ref.current;
      if (!c) { c = document.createElement("canvas"); ref.current = c; }
      c.width = cw; c.height = ch;
      const cx = c.getContext("2d");
      if (cx) { cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.lineCap = "round"; cx.lineJoin = "round"; }
    }
  };
  const clearLayer = (c: HTMLCanvasElement | null) => {
    const cx = c?.getContext("2d"); if (!c || !cx) return;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, c.width, c.height); cx.restore();
  };
  // Draw a stroke's geometry at FULL opacity onto any layer (CSS-px coords).
  const paintGeom = (cx: CanvasRenderingContext2D, st: Stroke) => {
    cx.strokeStyle = st.erase ? "#000" : st.color; cx.fillStyle = cx.strokeStyle;
    const pts = st.pts;
    cx.beginPath(); cx.arc(pts[0].x, pts[0].y, pts[0].w / 2, 0, Math.PI * 2); cx.fill();
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], cur = pts[i];
      const prevMid = i >= 2 ? mid(pts[i - 2], prev) : prev;
      const curMid = mid(prev, cur);
      cx.lineWidth = cur.w;
      cx.beginPath(); cx.moveTo(prevMid.x, prevMid.y); cx.quadraticCurveTo(prev.x, prev.y, curMid.x, curMid.y); cx.stroke();
    }
  };
  // Flatten one finished stroke into `baked`. Pen: render full-opacity on scratch,
  // then blit ONCE at its alpha — one even layer, no join build-up. Eraser: cut
  // straight into baked (always fully opaque).
  const bakeStroke = (st: Stroke) => {
    const baked = bakedRef.current, scratch = scratchRef.current;
    const bctx = baked?.getContext("2d"); if (!baked || !bctx) return;
    if (st.erase) {
      bctx.globalCompositeOperation = "destination-out";
      paintGeom(bctx, st);
      bctx.globalCompositeOperation = "source-over";
      return;
    }
    const sctx = scratch?.getContext("2d"); if (!scratch || !sctx) return;
    clearLayer(scratch);
    paintGeom(sctx, st);
    bctx.save(); bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.globalAlpha = st.alpha; bctx.drawImage(scratch, 0, 0); bctx.globalAlpha = 1;
    bctx.restore();
  };
  // Present = baked, plus the live pen stroke from scratch at its alpha on top.
  const present = () => {
    const main = ctxRef.current, mc = canvasRef.current, baked = bakedRef.current;
    if (!main || !mc || !baked) return;
    main.save(); main.setTransform(1, 0, 0, 1, 0, 0);
    main.clearRect(0, 0, mc.width, mc.height);
    main.drawImage(baked, 0, 0);
    const cur = curRef.current;
    if (strokingRef.current && cur && !cur.erase && scratchRef.current) {
      main.globalAlpha = curAlphaRef.current; main.drawImage(scratchRef.current, 0, 0); main.globalAlpha = 1;
    }
    main.restore();
  };
  const redraw = () => {
    clearLayer(bakedRef.current);
    for (const st of strokesRef.current) bakeStroke(st);
    present();
  };
  const clearBitmap = () => { clearLayer(bakedRef.current); clearLayer(scratchRef.current); present(); };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current; if (!canvas || !bakedRef.current) return;
    strokingRef.current = true;
    if (coarse) setIslandLit(false); // a new touch stroke re-dims the island
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect(); rectRef.current = { left: rect.left, top: rect.top };
    const erase = toolRef.current === "eraser";
    const w = erase ? ERASER_W : penWidthRef.current;
    const p: SPt = { x: e.clientX - rect.left, y: e.clientY - rect.top, w };
    curAlphaRef.current = erase ? 1 : penAlphaRef.current;
    curRef.current = { erase, color: penHexRef.current, alpha: curAlphaRef.current, pts: [p] };
    clearLayer(scratchRef.current);
    // Pen paints on scratch (full opacity); eraser cuts straight into baked.
    const target = (erase ? bakedRef.current : scratchRef.current)?.getContext("2d");
    if (target) {
      if (erase) target.globalCompositeOperation = "destination-out";
      target.fillStyle = erase ? "#000" : penHexRef.current;
      target.beginPath(); target.arc(p.x, p.y, w / 2, 0, Math.PI * 2); target.fill();
      if (erase) target.globalCompositeOperation = "source-over";
    }
    present();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !strokingRef.current) return;
    const st = curRef.current; if (!st) return;
    const pts = st.pts, prev = pts[pts.length - 1];
    const cx = e.clientX - rectRef.current.left, cy = e.clientY - rectRef.current.top;
    const dist = Math.hypot(cx - prev.x, cy - prev.y);
    if (dist < 1.2) return;
    let w: number;
    if (st.erase) w = ERASER_W;
    else { const base = penWidthRef.current; const speed = dist / 16; w = prev.w * 0.65 + Math.max(base * 0.35, base * (1.35 - speed * 0.85)) * 0.35; }
    const cur: SPt = { x: cx, y: cy, w };
    const prevMid = pts.length >= 2 ? mid(pts[pts.length - 2], prev) : prev;
    const curMid = mid(prev, cur);
    const target = (st.erase ? bakedRef.current : scratchRef.current)?.getContext("2d");
    if (target) {
      if (st.erase) target.globalCompositeOperation = "destination-out";
      target.strokeStyle = st.erase ? "#000" : st.color;
      target.lineWidth = w;
      target.beginPath(); target.moveTo(prevMid.x, prevMid.y); target.quadraticCurveTo(prev.x, prev.y, curMid.x, curMid.y); target.stroke();
      if (st.erase) target.globalCompositeOperation = "source-over";
    }
    pts.push(cur);
    present();
  };
  const endStroke = () => {
    strokingRef.current = false;
    const cur = curRef.current;
    if (cur && cur.pts.length) {
      // Pen: scratch already holds the whole stroke at full opacity — flatten once.
      if (!cur.erase) {
        const baked = bakedRef.current, scratch = scratchRef.current, b = baked?.getContext("2d");
        if (baked && scratch && b) {
          b.save(); b.setTransform(1, 0, 0, 1, 0, 0);
          b.globalAlpha = cur.alpha; b.drawImage(scratch, 0, 0); b.globalAlpha = 1;
          b.restore();
        }
      }
      strokesRef.current.push(cur); redoRef.current = []; setHistVer((v) => v + 1);
    }
    clearLayer(scratchRef.current);
    curRef.current = null;
    present();
  };
  const undo = () => { const s = strokesRef.current.pop(); if (!s) return; redoRef.current.push(s); redraw(); setHistVer((v) => v + 1); };
  const redo = () => { const s = redoRef.current.pop(); if (!s) return; strokesRef.current.push(s); redraw(); setHistVer((v) => v + 1); };
  const clearAll = () => { strokesRef.current = []; redoRef.current = []; redraw(); setHistVer((v) => v + 1); };
  // Entering draw closes any open flyout panel first — only one tool is ever open.
  const toggleDraw = () => { if (drawing) { endStroke(); setDrawing(false); playSound("collapse"); } else { setColorState("closed"); setEffectsOpen(false); setFontOpen(false); setDrawing(true); playSound("expand"); } };

  // A slider/colour-picker "detent" must only tick when the value actually MOVES.
  // Holding the pointer past the end of a track pins the value at min/max, so the
  // haptic has to fall silent there instead of looping every pointermove — the same
  // gate the Web Haptics demo uses (tick on real travel, per slider), keyed so each
  // control tracks its own last-ticked position.
  const lastDetent = useRef<Record<string, number[]>>({});
  const detent = (e: React.PointerEvent, key: string, comps: number[], step = 0.045) => {
    const prev = lastDetent.current[key];
    const moved = e.type === "pointerdown" || !prev || comps.some((c, i) => Math.abs(c - prev[i]) >= step);
    if (moved) {
      lastDetent.current[key] = comps;
      playSound("haptic");
    }
  };
  const dragPenSV = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
    detent(e, "penSV", [s, v]);
    setPenSat(s); setPenVal(v); setTool("pen");
  };
  const dragPenHue = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    detent(e, "penHue", [f]);
    setPenHue(Math.round(f * 360));
    setTool("pen");
  };

  // Scroll is locked while drawing. Instead of tugging the page (removed site-wide),
  // a scroll attempt just fires one top-centre notification — deduped by id so a
  // flurry of wheel/key events updates the same toast rather than stacking.
  useEffect(() => {
    if (!drawing) return;
    const warnScroll = () =>
      notify.system("Drawing is on", "Turn it off to scroll", { id: "draw-scroll", duration: 1600 });
    const onWheel = (e: WheelEvent) => { e.preventDefault(); warnScroll(); };
    // Touch is the drawing gesture itself, so it only blocks page scroll (the
    // canvas already has touch-action:none) — no notification spam mid-stroke.
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) { e.preventDefault(); warnScroll(); }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel); window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("keydown", onKey);
    };
  }, [drawing]);

  /* font — a picker of faces, like the effects picker (not a blind cycle) */
  const [fontI, setFontI] = useState(0);
  const fontLoads = useRef(new Map<number, Promise<boolean>>());
  const loadFont = (i: number) => {
    const cached = fontLoads.current.get(i);
    if (cached) return cached;
    const variable = FONTS[i]?.slice(4, -1) ?? "--font-inter-locked";
    const family = getComputedStyle(document.documentElement).getPropertyValue(variable).split(",")[0].trim();
    let timeout: ReturnType<typeof setTimeout>;
    const loading = Promise.race([
      Promise.all([400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 16px ${family}`))).then(() => true),
      new Promise<boolean>((resolve) => { timeout = setTimeout(() => resolve(false), 4000); }),
    ]).catch(() => false).then((ready) => {
      clearTimeout(timeout);
      if (!ready) fontLoads.current.delete(i);
      return ready;
    });
    fontLoads.current.set(i, loading);
    return loading;
  };
  const warmFonts = () => { FONTS.forEach((_, i) => { void loadFont(i); }); };
  const [fontOpen, setFontOpen] = useState(false);
  const closeDraw = () => { if (drawing) { endStroke(); setDrawing(false); } };
  const applyFont = (i: number) => {
    setFontI(i);
    if (FONTS[i]) document.documentElement.style.setProperty("--font-inter", FONTS[i] as string);
    else document.documentElement.style.removeProperty("--font-inter");
    // Match x-height to Inter so the swapped face renders at Inter's apparent size.
    const adj = FONT_ADJUST[i];
    if (adj) document.body.style.setProperty("font-size-adjust", adj);
    else document.body.style.removeProperty("font-size-adjust");
    const tracking = FONT_TRACKING[i];
    if (tracking) {
      document.body.style.setProperty("--mh-font-tracking", tracking);
      document.body.style.setProperty("letter-spacing", tracking);
      document.body.classList.add("mh-font-tracked");
    } else {
      document.body.style.removeProperty("--mh-font-tracking");
      document.body.style.removeProperty("letter-spacing");
      document.body.classList.remove("mh-font-tracked");
    }
    playSound("tick");
  };
  const toggleFont = () => { closeDraw(); setColorState("closed"); setEffectsOpen(false); const willOpen = !fontOpen; playSound(willOpen ? "expand" : "collapse"); setFontOpen(willOpen); };

  /* site colour — one button toggles the BACKGROUND-colour picker. Text/ink colour
     now lives in the font panel, independent of the background. */
  const [colorState, setColorState] = useState<"closed" | "bg">("closed");
  const colorOpen = colorState !== "closed";
  const cycleColor = () => {
    closeDraw(); setEffectsOpen(false); setFontOpen(false);
    const next = colorState === "closed" ? "bg" : "closed";
    playSound(next === "bg" ? "expand" : "collapse");
    setColorState(next);
  };
  // Effects picker: mutually exclusive with the draw + colour + font panels.
  const toggleEffects = () => { closeDraw(); setColorState("closed"); setFontOpen(false); const willOpen = !effectsOpen; playSound(willOpen ? "expand" : "collapse"); setEffectsOpen(willOpen); };
  const [hue, setHue] = useState(210); const [sat, setSat] = useState(0.6); const [val, setVal] = useState(0.9);
  const [colorActive, setColorActive] = useState(false);
  // Text/ink colour lives in the FONT panel now, independent of the background colour.
  // Neutral until dragged; its own state + persisted record so both can coexist.
  const [fontHue, setFontHue] = useState(210); const [fontSat, setFontSat] = useState(0.5); const [fontVal, setFontVal] = useState(0.35);
  const [textColorActive, setTextColorActive] = useState(false);
  const textPaintRef = useRef<{ h: number; s: number; v: number } | null>(null);
  // The last painted colours, kept in refs so the theme-toggle observer (empty deps)
  // can re-apply them without a stale closure. Null when no custom colour.
  const paintRef = useRef<{ h: number; s: number; v: number } | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  // Holds the in-flight dice-roll timeout so a new roll (or a reset) cancels it.
  const rollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollGeneration = useRef(0);
  const [rolling, setRolling] = useState(false);
  useEffect(() => () => {
    rollGeneration.current += 1;
    if (rollRef.current) clearTimeout(rollRef.current);
  }, []);
  const readBg = (): RGB => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    const m = raw.match(/[\d.]+/g);
    if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
    return document.documentElement.classList.contains("dark") ? [10, 10, 10] : [250, 250, 249];
  };
  const paintBg = (h: number, s: number, v: number) => {
    const bg = hsvToRgb(h, s, v), ink = legibleInk(bg, h, s), root = document.documentElement.style;
    root.setProperty("--background", rgbStr(bg)); root.setProperty("--foreground", rgbStr(ink));
    root.setProperty("--muted-foreground", rgbStr(mix(ink, bg, 0.38))); root.setProperty("--ring", rgbStr(mix(ink, bg, 0.35)));
    for (const [name, amt] of TINT) root.setProperty(name, rgbStr(amt === "ink" ? ink : amt === "bg" ? bg : mix(bg, ink, amt as number)));
    setColorActive(true);
  };
  const paintText = (h: number, s: number, v: number) => {
    const fg = hsvToRgb(h, s, v), bg = readBg(), root = document.documentElement.style;
    root.setProperty("--foreground", rgbStr(fg));
    root.setProperty("--muted-foreground", rgbStr(mix(fg, bg, 0.4))); root.setProperty("--ring", rgbStr(mix(fg, bg, 0.35)));
    for (const [name, amt] of TINT) if (amt === "ink") root.setProperty(name, rgbStr(fg));
    setTextColorActive(true);
  };
  // Reset clears BOTH colours (COLOR_VARS is a superset of the ink vars text paints).
  const resetColor = () => { const root = document.documentElement.style; for (const v of COLOR_VARS) root.removeProperty(v); paintRef.current = null; textPaintRef.current = null; setColorActive(false); setTextColorActive(false); try { localStorage.removeItem(COLOR_KEY); localStorage.removeItem(TEXT_COLOR_KEY); } catch {} };
  // Background: paint it, remember it, then re-assert any custom text colour on top —
  // paintBg re-derives --foreground, which would otherwise clobber the text tint.
  const applyColor = (h: number, s: number, v: number) => { setHue(h); setSat(s); setVal(v); paintBg(h, s, v); paintRef.current = { h, s, v }; try { localStorage.setItem(COLOR_KEY, JSON.stringify({ h, s, v })); } catch {} const tp = textPaintRef.current; if (tp) paintText(tp.h, tp.s, tp.v); };
  // Text/ink colour (font panel). Only touches the ink vars; reads the live bg.
  const applyTextColor = (h: number, s: number, v: number) => { setFontHue(h); setFontSat(s); setFontVal(v); paintText(h, s, v); textPaintRef.current = { h, s, v }; try { localStorage.setItem(TEXT_COLOR_KEY, JSON.stringify({ h, s, v })); } catch {} };
  // Restore a saved site colour on load so it survives a full reload / hard nav —
  // paint the vars straight onto <html> without opening the picker. Runs once; the
  // theme class is already set (next-themes' pre-hydration script) so bg/ink land right.
  useEffect(() => {
    const load = (key: string): { h: number; s: number; v: number } | null => {
      try {
        const raw = localStorage.getItem(key); if (!raw) return null;
        const r = JSON.parse(raw);
        return typeof r?.h === "number" && typeof r?.s === "number" && typeof r?.v === "number" ? { h: r.h, s: r.s, v: r.v } : null;
      } catch { return null; }
    };
    // Background first (it derives an ink), then text on top so a custom ink wins.
    const bg = load(COLOR_KEY);
    if (bg) { setHue(bg.h); setSat(bg.s); setVal(bg.v); paintRef.current = bg; paintBg(bg.h, bg.s, bg.v); }
    const text = load(TEXT_COLOR_KEY);
    if (text) { setFontHue(text.h); setFontSat(text.s); setFontVal(text.v); textPaintRef.current = text; paintText(text.h, text.s, text.v); }
  }, []);
  useEffect(() => {
    if (!colorOpen && !effectsOpen && !fontOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!islandRef.current?.contains(e.target as Node)) { setColorState("closed"); setEffectsOpen(false); setFontOpen(false); }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [colorOpen, effectsOpen, fontOpen]);
  // Toggling the theme swaps the <html> `dark` class, which replaces every semantic
  // colour var from globals.css. A custom-painted colour lives as inline vars that
  // would otherwise be left stranded (bg) or wiped by the swap — so on any class
  // change, re-apply the last paint against the new theme instead of clearing it.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const p = paintRef.current; if (p) paintBg(p.h, p.s, p.v);        // bg first (derives ink)
      const tp = textPaintRef.current; if (tp) paintText(tp.h, tp.s, tp.v); // custom ink wins
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  // Wheeling over the island never scrolls the page underneath it — the island is
  // a fixed control surface, not part of the flow. The one exception is its own
  // scrollable inner list (the font picker): that scrolls internally, and its
  // overscroll-contain stops a boundary scroll from leaking back out to the page.
  // Native non-passive listener so preventDefault actually blocks the scroll.
  useEffect(() => {
    const el = islandRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const scroller = (e.target as Element | null)?.closest?.("[data-font-scroll]") as HTMLElement | null;
      if (scroller && scroller.scrollHeight > scroller.clientHeight) return; // let the list scroll itself
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  // Draw mode: relight the island only when the marker is over it; also flag the
  // whole document so the memoji widget fades back (CSS in globals.css).
  useEffect(() => {
    if (!drawing) { setIslandLit(true); delete document.documentElement.dataset.drawing; return; }
    document.documentElement.dataset.drawing = "";
    // Touch: no hover to reveal the pen panel, so entering draw keeps the island LIT
    // with its controls out — discoverable, not a faded bar you must guess to tap.
    // Starting a stroke on the canvas dims it out of the way (see onPointerDown), and
    // a tap brings it back. Fine pointers keep the cursor hover-to-relight behaviour.
    if (coarse) { setIslandLit(true); return; }
    const onMove = (e: PointerEvent) => {
      if (strokingRef.current) return; // don't grab focus mid-stroke
      const r = islandRef.current?.getBoundingClientRect();
      setIslandLit(!!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
    };
    window.addEventListener("pointermove", onMove);
    return () => { window.removeEventListener("pointermove", onMove); delete document.documentElement.dataset.drawing; };
  }, [drawing, coarse]);
  const dragSV = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
    detent(e, "sv", [s, v]);
    applyColor(hue, s, v);
  };
  const dragHue = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    detent(e, "hue", [f]);
    applyColor(f * 360, sat, val);
  };
  // Text/ink colour picker (font panel). Any drag turns a custom ink colour on.
  const dragTextSV = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
    detent(e, "textSV", [s, v]);
    applyTextColor(fontHue, s, v);
  };
  const dragTextHue = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    detent(e, "textHue", [f]);
    applyTextColor(f * 360, fontSat, fontVal);
  };
  // Horizontal 1-D sliders (thickness, opacity). frac is 0..1 left→right.
  const dragFrac = (e: React.PointerEvent, key: string, apply: (frac: number) => void) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    detent(e, key, [f]);
    apply(f);
  };
  const dragWidth = (e: React.PointerEvent) => dragFrac(e, "width", (f) => { setPenWidth(Math.round((PEN_MIN + f * (PEN_MAX - PEN_MIN)) * 10) / 10); setTool("pen"); });
  const dragAlpha = (e: React.PointerEvent) => dragFrac(e, "alpha", (f) => { setPenAlpha(f); setTool("pen"); });

  // Effect tint picker (SV box + hue bar). Any drag switches the effect off neutral.
  const dragFxSV = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
    detent(e, "fxSV", [s, v]);
    setFxSat(s); setFxVal(v);
    setFxTinted(true);
  };
  const dragFxHue = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement; el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    detent(e, "fxHue", [f]);
    setFxHue(Math.round(f * 360));
    setFxTinted(true);
  };
  const dragFxOpacity = (e: React.PointerEvent) => dragFrac(e, "fxOpacity", (f) => setFxOpacity(f));

  const resetAll = () => {
    playSound("reset");
    rollGeneration.current += 1; // also cancel a roll waiting for its fonts
    setRolling(false);
    if (rollRef.current) clearTimeout(rollRef.current); // stop a dice roll mid-flight
    resetColor(); setColorState("closed"); setFontI(0);
    document.documentElement.style.removeProperty("--font-inter");
    document.body.style.removeProperty("font-size-adjust");
    document.body.style.removeProperty("--mh-font-tracking");
    document.body.style.removeProperty("letter-spacing");
    document.body.classList.remove("mh-font-tracked");
    setPenWidth(BASE_W); setPenAlpha(1);
    clearAll(); setCatOn(false); setEffect(null); setEffectsOpen(false); setFontOpen(false); setFxTinted(false); setFxOpacity(1);
    if (drawing) { endStroke(); setDrawing(false); }
  };

  // Dice — roll through distinct complete looks, rather than independently
  // re-sampling each field (which made near-identical runs surprisingly common).
  // Font and effect both use a shuffled bag, so every hop changes the site's type
  // as well as its ambient treatment. Pressing the dice explicitly requests the
  // roll; reduced motion still governs the surrounding passive transitions.
  const randomize = async () => {
    closeDraw(); setColorState("closed"); setEffectsOpen(false); setFontOpen(false);
    if (rollRef.current) clearTimeout(rollRef.current);
    const generation = ++rollGeneration.current;
    setRolling(true);
    const steps = 9;
    const candidates = shuffledIndices(FONTS.length, fontI).slice(0, steps);
    // Fetch faces before animating through them. Lazy fonts otherwise arrive
    // halfway through a hop and turn a deliberate swap into a fallback-font jump.
    const ready = await Promise.all(candidates.map(loadFont));
    if (generation !== rollGeneration.current) return;
    const fontOrder = candidates.filter((_, i) => ready[i]);
    if (!fontOrder.length) fontOrder.push(fontI);
    const effectCurrent = Math.max(0, EFFECTS.findIndex(({ id }) => id === effect));
    const effectOrder = shuffledIndices(EFFECTS.length, effectCurrent);
    const hueOrder = shuffledIndices(ROLL_HUES.length, Math.round(hue / 360 * (ROLL_HUES.length - 1)));
    let i = 0;
    const hop = () => {
      if (generation !== rollGeneration.current) return;
      const font = fontOrder[i % fontOrder.length];
      const effectIndex = effectOrder[i % effectOrder.length];
      const hueBase = ROLL_HUES[hueOrder[i % hueOrder.length]];
      const isDarkPalette = i % 2 === 1;
      const bgHue = (hueBase + (Math.random() * 30 - 15) + 360) % 360;
      const bgSat = 0.3 + Math.random() * 0.65;
      const bgVal = isDarkPalette ? 0.2 + Math.random() * 0.26 : 0.68 + Math.random() * 0.25;
      // The text picker is part of the look too. Keep it on the opposite end of
      // the value range from the background, so even a colourful roll remains
      // comfortably readable rather than merely technically different.
      const textHue = (hueBase + 150 + Math.random() * 120) % 360;
      const textSat = 0.08 + Math.random() * 0.56;
      const textVal = isDarkPalette ? 0.84 + Math.random() * 0.16 : 0.06 + Math.random() * 0.22;

      applyFont(font); // A real site-wide font swap on every stop, with a tick.
      applyColor(bgHue, bgSat, bgVal);
      applyTextColor(textHue, textSat, textVal);
      setEffect(EFFECTS[effectIndex].id);
      setFxHue((hueBase + 90 + Math.random() * 150) % 360);
      setFxSat(0.35 + Math.random() * 0.6); setFxVal(0.5 + Math.random() * 0.45);
      setFxTinted(true); setFxOpacity(0.32 + Math.random() * 0.68);
      i += 1;
      if (i < steps) rollRef.current = setTimeout(hop, 52 + i * i * 4); // 56, 68, 88, 116 … decelerating
      else { rollRef.current = null; setRolling(false); }
    };
    hop();
  };

  const fxRGB = hsvToRgb(fxHue, fxSat, fxVal);
  const fxColor = fxTinted ? `${fxRGB[0]},${fxRGB[1]},${fxRGB[2]}` : null;
  const fxSwatch = rgbStr(fxRGB);
  const swatch = rgbStr(hsvToRgb(hue, sat, val));
  const textSwatch = rgbStr(hsvToRgb(fontHue, fontSat, fontVal));
  const widthFrac = (penWidth - PEN_MIN) / (PEN_MAX - PEN_MIN);
  // In draw mode the draw panel only drawers out while the island is lit (marker
  // over it); leaving collapses it back before the island dims.
  // What's logically open vs what's actually shown. The island only reveals its
  // panel while ENGAGED — hovered on a fine pointer, the marker over it while
  // drawing, or (on touch, which has no hover) any panel simply left open. Leaving
  // collapses the panel THEN dims the island (two-step); hovering back pops it open.
  const open: "draw" | "color" | "font" | "effects" | null = drawing ? "draw" : colorOpen ? "color" : effectsOpen ? "effects" : fontOpen ? "font" : null;
  const lit = (drawing ? islandLit : hovered || coarse) || focused;
  const panel = open && lit ? open : null;
  // Retain the outgoing content while the persistent shell closes. A new tool
  // changes its measured height directly, including during an interrupted close.
  const [lastPanel, setLastPanel] = useState(panel);
  if (panel && panel !== lastPanel) setLastPanel(panel);
  const contentPanel = panel ?? lastPanel;
  const customized = colorActive || textColorActive || fontI !== 0 || drawing || catOn || effect !== null || strokesRef.current.length > 0;
  // Back / Close, incorporated into the island. `useScrollHost` hands us the
  // top-most open `[data-overlay]` element as `host`; its `data-overlay` value
  // ("back" on a feed, "close" on a single post) says which control to show, and
  // only the writing/design feed + post overlays carry it, so nothing appears on
  // the home page. Dispatching Escape reuses the sections' own close handlers.
  const overlayNav = (host?.dataset.overlay as "back" | "close" | undefined) || null;
  const closeOverlay = () => { playSound("collapse"); window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); };
  // The effects button wears the active effect's glyph (Sparkle when off).
  const EffIcon = effect ? EFFECT_ICON[effect] : Sparkle;
  void histVer;

  return (
    <>
      {/* Faint ambient effect painted behind page content (-z-10), inside whatever
          is scrolling — the document, or an open post overlay — so it shows on posts. */}
      <BackgroundEffects effect={effect} dark={resolvedTheme === "dark"} reduce={reduce} color={fxColor} opacity={fxOpacity} host={host} />

      {/* The ink canvas lives inside whatever is scrolling — the document, or the
          open post overlay — so strokes pin to that content and scroll with it
          instead of floating over the viewport. */}
      {mounted && createPortal(
        <canvas
          ref={canvasRef}
          aria-hidden={!drawing}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          style={{ cursor: drawing ? (tool === "eraser" ? ERASER_CURSOR : markerCursor(penColorHex)) : undefined }}
          className={cn(
            "absolute left-0 top-0",
            // While drawing: on top of everything so you paint over the whole page.
            // Idle: below the hover-blur scrim (z-30) and expanded dialogs (z-40/50)
            // so posts blur the strokes and expanded panels sit above them.
            drawing ? "z-[95000] pointer-events-auto touch-none" : "z-[25] pointer-events-none",
          )}
        />,
        host ?? document.body,
      )}

      <CatCursor active={catOn} />

      {/* Dynamic Island — one connected rounded-rect (rounded-[16px], not a pill),
          centred at the bottom, that morphs open to reveal the draw / colour / font /
          effects panels. In draw mode it
          fades back so you can draw behind it, relighting when the marker is over it. */}
      <div className={cn("pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-center", drawing ? "z-[95010]" : "z-[300]")}>
        <motion.div
          ref={islandRef}
          data-toolbar
          onFocusCapture={(e) => { if (e.target.matches(":focus-visible")) setFocused(true); }}
          onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          // Touch: a tap on the dimmed island relights it (and swallows that tap so
          // it doesn't also trigger a tool), matching desktop's hover-to-relight.
          onPointerDownCapture={(e) => {
            setFocused(false);
            if (coarse && drawing && !islandLit) { e.preventDefault(); e.stopPropagation(); setIslandLit(true); }
          }}
          // Resting opacity is dim; it lifts to full while engaged (hovered, or a
          // panel open). Draw-mode keeps its own two-step dim when the marker is off
          // the island so you can draw behind it.
          // Dim whenever the cursor is off the island — even with a panel open — so
          // it always recedes at rest. Touch has no persistent hover, so there an
          // open panel keeps it lit (you tapped it open) until you tap away.
          animate={{ opacity: drawing && !islandLit ? 0.4 : lit ? 1 : 0.45 }}
          // Dimming waits for the panel to collapse first (two-step); relighting
          // is immediate so the panel can drawer straight back out.
          // Delay the dim while a panel is collapsing (any open panel + not lit), so
          // it animates closed before the island recedes — same two-step as draw mode.
          transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : open && !lit ? 0.28 : 0, ease: [0.23, 1, 0.32, 1] }}
          // Fine pointers: dimmed island is click-through so you draw over it. Touch:
          // keep it tappable so the tap above can relight it.
          style={{ pointerEvents: drawing && !islandLit && !coarse ? "none" : "auto" }}
          // col-reverse so the icon row stays pinned to the bottom edge and the
          // panel drawers upward into free space — same as it opened downward from
          // the top, mirrored, so the buttons never shift under the cursor.
          className="flex w-fit flex-col-reverse overflow-hidden rounded-[16px] border border-border bg-card/85 shadow-[0_14px_44px_rgba(0,0,0,0.16)] backdrop-blur-xl"
        >
          {/* icon row — each glyph has its own hover motion; tooltips rise above.
              shrink-0 on every item so no button compresses/clips inside the bar.
              The island width hugs this row (w-fit) so there's no dead gutter, and
              the optional Home button on standalone routes just widens it. */}
          <div className="flex items-center justify-center gap-0.5 p-1.5 max-[360px]:gap-0 max-[360px]:p-1 [&>*]:shrink-0">
            {/* Back / Close / Home are NOT in the island — they render as standalone
                top-centred pills via <OverlayControls> (components/overlay-controls.tsx). */}
            <Tip label="Theme" side="top">
              {mounted ? (
                <AnimatedThemeToggler theme={resolvedTheme === "dark" ? "dark" : "light"} onThemeChange={(t) => { setColorState("closed"); setEffectsOpen(false); setFontOpen(false); playSound("tick"); setTheme(t); }} aria-label="Toggle light and dark mode" className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:rotate-[25deg]")} lightIcon={<Moon size={ICON} weight="bold" />} darkIcon={<Sun size={ICON} weight="bold" />} />
              ) : (
                <span className={BTN} />
              )}
            </Tip>
            <Tip label={drawing ? "Done" : "Draw"} side="top">
              <button type="button" onClick={toggleDraw} aria-label={drawing ? "Cement drawing and exit" : "Draw over the page"} aria-pressed={drawing} className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:-rotate-[18deg]", drawing && BTN_ON)}>
                {drawing ? <X size={ICON} weight="bold" /> : <PencilSimple size={ICON} weight="bold" />}
              </button>
            </Tip>
            <Tip label="Font" side="top">
              <button type="button" onClick={toggleFont} aria-label="Choose the site font and text colour" aria-expanded={fontOpen} className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:scale-[1.18]", (fontOpen || fontI !== 0 || textColorActive) && BTN_ON)}>
                <TextAa size={ICON} weight="bold" />
              </button>
            </Tip>
            <Tip label={colorOpen ? "Background" : "Colour"} side="top">
              <button type="button" onClick={cycleColor} aria-label={colorOpen ? "Colouring the background" : "Recolour the site background"} aria-expanded={colorOpen} className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:rotate-[30deg]", (colorOpen || colorActive) && BTN_ON)}>
                <Palette size={ICON} weight={colorActive ? "fill" : "bold"} />
              </button>
            </Tip>
            <Tip label="Effects" side="top">
              <button type="button" onClick={toggleEffects} aria-label={effect ? `Background effect: ${effect}` : "Ambient background effects"} aria-expanded={effectsOpen} className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:rotate-[18deg]", (effectsOpen || effect !== null) && BTN_ON)}>
                <EffIcon size={ICON} weight="bold" />
              </button>
            </Tip>
            <Tip label={catOn ? "Shoo" : "Cat"} side="top">
              <button type="button" onClick={() => { setColorState("closed"); setEffectsOpen(false); setFontOpen(false); const nv = !catOn; playSound(nv ? "on" : "off"); setCatOn(nv); }} aria-label={catOn ? "Stop the cat following the cursor" : "Make a cat follow the cursor"} aria-pressed={catOn} className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:-rotate-[12deg]", catOn && BTN_ON)}>
                <CatMark className="h-[18px] w-[22px]" />
              </button>
            </Tip>
            <Tip label="Randomize" side="top">
              <button type="button" onClick={randomize} onPointerEnter={warmFonts} onFocus={warmFonts} aria-busy={rolling} aria-label="Randomize the font, colour, and effect" className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:rotate-[18deg]")}>
                <DiceFive size={ICON} weight="bold" />
              </button>
            </Tip>
            <Tip label={soundOn ? "Mute sounds" : "Enable sounds"} side="top">
              <button type="button" data-sound-feedback="off" aria-label={soundOn ? "Mute site sounds" : "Enable site sounds"} aria-pressed={soundOn} onClick={() => { const enabled = !soundOn; setSoundEnabled(enabled); if (enabled) playSound("on"); }} className={BTN}>
                {soundOn ? <SpeakerHigh size={ICON} weight="bold" /> : <SpeakerSlash size={ICON} weight="bold" />}
              </button>
            </Tip>
            <Tip label="Reset" side="top">
              <button type="button" onClick={resetAll} disabled={!customized && !rolling} aria-label="Reset customizations" className={cn(BTN, "[@media(hover:hover)]:hover:[&_svg]:-rotate-[200deg]", "disabled:opacity-30 disabled:pointer-events-none")}>
                <ArrowsCounterClockwise size={ICON - 1} weight="bold" />
              </button>
            </Tip>
          </div>

          <ToolbarPanel open={!!panel}>
            <motion.div key={contentPanel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.14 }}>
                <div className="border-b border-border px-3 pb-2.5 pt-3">
                  {contentPanel === "draw" ? (
                    <>
                      <Tip label="Colour">
                        <div onPointerDown={dragPenSV} onPointerMove={(e) => e.buttons === 1 && dragPenSV(e)} className="relative h-28 w-full cursor-crosshair touch-none rounded-lg" style={{ background: SV_GRAD(`hsl(${penHue} 100% 50%)`) }}>
                          <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${penSat * 100}%`, top: `${(1 - penVal) * 100}%`, background: penColorHex }} />
                        </div>
                      </Tip>
                      <div onPointerDown={dragPenHue} onPointerMove={(e) => e.buttons === 1 && dragPenHue(e)} className="relative mt-2.5 h-3 w-full cursor-pointer touch-none rounded-md" style={{ background: HUE_BAR }}>
                        <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${(penHue / 360) * 100}%`, background: `hsl(${penHue} 100% 50%)` }} />
                      </div>
                      <Tip label="Weight" className="mt-2.5">
                        <div onPointerDown={dragWidth} onPointerMove={(e) => e.buttons === 1 && dragWidth(e)} aria-label="Marker thickness" className="relative h-6 w-full cursor-pointer touch-none rounded-md bg-muted" style={{ backgroundImage: WEDGE_BG, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}>
                          {/* The nub IS a live preview of the pen tip: a round dot whose diameter is
                              the actual current weight, in the pen's colour, so what you see is
                              exactly what you draw. Round because the brush tip itself is round. */}
                          <span className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${widthFrac * 100}%`, width: `${penWidth}px`, height: `${penWidth}px`, background: penColorHex }} />
                        </div>
                      </Tip>
                      <Tip label="Opacity" className="mt-2.5">
                        <div onPointerDown={dragAlpha} onPointerMove={(e) => e.buttons === 1 && dragAlpha(e)} aria-label="Marker opacity" className="relative h-3 w-full cursor-pointer touch-none rounded-md" style={{ background: `linear-gradient(to right, var(--muted), ${penColorHex})` }}>
                          <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${penAlpha * 100}%`, background: penColorHex }} />
                        </div>
                      </Tip>
                      {/* tools */}
                      <div className="mt-3 flex items-center justify-between">
                        <Tip label={tool === "eraser" ? "Draw" : "Eraser"}><button type="button" onClick={() => { playSound("tick"); setTool((t) => (t === "eraser" ? "pen" : "eraser")); }} aria-label={tool === "eraser" ? "Switch to draw" : "Switch to eraser"} aria-pressed={tool === "eraser"} className={cn(TOOL, tool === "eraser" && BTN_ON)}>{tool === "eraser" ? <PencilSimple size={17} weight="bold" /> : <Eraser size={17} weight="bold" />}</button></Tip>
                        <Tip label="Undo"><button type="button" onClick={() => { playSound("tick"); undo(); }} disabled={strokesRef.current.length === 0} aria-label="Undo" className={TOOL}><ArrowUUpLeft size={17} weight="bold" /></button></Tip>
                        <Tip label="Redo"><button type="button" onClick={() => { playSound("tick"); redo(); }} disabled={redoRef.current.length === 0} aria-label="Redo" className={TOOL}><ArrowUUpRight size={17} weight="bold" /></button></Tip>
                        <Tip label="Clear drawing"><button type="button" onClick={() => { playSound("reset"); clearAll(); }} disabled={strokesRef.current.length === 0} aria-label="Clear drawing" className={TOOL}><Trash size={17} weight="bold" /></button></Tip>
                      </div>
                    </>
                  ) : contentPanel === "color" ? (
                    <>
                      {/* background colour only — text/ink colour now lives in the font panel.
                          SV box is h-20 to match the font + effects colour pickers exactly, so the
                          SV+hue pair reads as ONE shared picker across all three tabs. */}
                      <Tip label="Background">
                        <div onPointerDown={dragSV} onPointerMove={(e) => e.buttons === 1 && dragSV(e)} className="relative h-20 w-full cursor-crosshair touch-none rounded-lg" style={{ background: SV_GRAD(`hsl(${hue} 100% 50%)`) }}>
                          <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, background: swatch }} />
                        </div>
                      </Tip>
                      <div onPointerDown={dragHue} onPointerMove={(e) => e.buttons === 1 && dragHue(e)} className="relative mt-2.5 h-3 w-full cursor-pointer touch-none rounded-md" style={{ background: HUE_BAR }}>
                        <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${(hue / 360) * 100}%`, background: `hsl(${hue} 100% 50%)` }} />
                      </div>
                    </>
                  ) : contentPanel === "effects" ? (
                    // ambient background effect picker — icon-only, each named by its
                    // tooltip; the active one is lit, tap it again to turn it off. Below
                    // it a colour picker tints the particles (neutral chip = default).
                    <>
                      <div className="grid grid-cols-8 gap-1">
                        {EFFECTS.map((e) => {
                          const I = EFFECT_ICON[e.id];
                          const on = effect === e.id;
                          return (
                            <Tip key={e.id} label={e.label} className="w-full justify-center">
                              {/* Buttons FILL their grid column (w-full) instead of a fixed w-9, so the
                                  7-col grid never has an intrinsic width wider than the icon row — the
                                  w-fit island then only ever morphs open vertically, never left/right. */}
                              <button type="button" onClick={() => { playSound(on ? "off" : "on"); setEffect(on ? null : e.id); }} aria-label={on ? `Turn off ${e.label}` : `Turn on ${e.label}`} aria-pressed={on} className={cn(TOOL, "h-9 w-full [@media(hover:hover)]:hover:[&_svg]:scale-[1.15] [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-out", on && BTN_ON)}>
                                <I size={18} weight="bold" />
                              </button>
                            </Tip>
                          );
                        })}
                      </div>
                      {/* Opacity sits ABOVE the SV+hue pair, so those two stay anchored at the
                          bottom of the panel — identical to the colour + font tabs. Switching
                          between the three then reads as one shared picker with different extras
                          stacked above it (the effect grid + opacity here, the font list there). */}
                      <Tip label="Opacity" className="mt-2.5">
                        <div onPointerDown={dragFxOpacity} onPointerMove={(e) => e.buttons === 1 && dragFxOpacity(e)} aria-label="Effect opacity" className="relative h-3 w-full cursor-pointer touch-none rounded-md" style={{ background: `linear-gradient(to right, var(--muted), ${fxTinted ? fxSwatch : "var(--foreground)"})` }}>
                          <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${fxOpacity * 100}%`, background: fxTinted ? fxSwatch : "var(--foreground)" }} />
                        </div>
                      </Tip>
                      <Tip label="Effect colour" className="mt-2.5">
                        <div onPointerDown={dragFxSV} onPointerMove={(e) => e.buttons === 1 && dragFxSV(e)} className="relative h-20 w-full cursor-crosshair touch-none rounded-lg" style={{ background: SV_GRAD(`hsl(${fxHue} 100% 50%)`) }}>
                          <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${fxSat * 100}%`, top: `${(1 - fxVal) * 100}%`, background: fxSwatch, opacity: fxTinted ? 1 : 0.85 }} />
                        </div>
                      </Tip>
                      <div onPointerDown={dragFxHue} onPointerMove={(e) => e.buttons === 1 && dragFxHue(e)} className="relative mt-2.5 h-3 w-full cursor-pointer touch-none rounded-md" style={{ background: HUE_BAR }}>
                        <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${(fxHue / 360) * 100}%`, background: `hsl(${fxHue} 100% 50%)` }} />
                      </div>
                    </>
                  ) : (
                    // font picker — the face list on top, then a text/ink colour picker BELOW it
                    // (the SV+hue pair sits at the bottom of the panel, identical in size + place
                    // to the colour + effects tabs, so switching tabs reads as one shared picker
                    // with the font list stacked above). Each row is its own face; tap to apply.
                    // The list scrolls (overscroll-contain keeps a boundary scroll from leaking to
                    // the page). Each preview wears the same x-height normalisation it'll get when
                    // applied, so the row shows its true rendered size.
                    <>
                      <div data-font-scroll className="flex max-h-[228px] flex-col gap-0.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]">
                      {FONT_NAMES.map((name, i) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => applyFont(i)}
                          aria-label={`Set font to ${name}`}
                          aria-pressed={fontI === i}
                          className={cn(
                            "flex h-9 shrink-0 items-center rounded-lg px-3 text-[15px] text-muted-foreground outline-none transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] [@media(hover:hover)]:hover:bg-muted/70 [@media(hover:hover)]:hover:text-foreground",
                            fontI === i && BTN_ON,
                          )}
                          // Inter's preview (FONTS[0] === null) must use the locked copy: the
                          // switcher overwrites --font-inter on the root, so referencing it here
                          // would render this row in the active face instead of real Inter.
                          style={{ fontFamily: FONTS[i] ?? "var(--font-inter-locked)", fontSizeAdjust: FONT_ADJUST[i] ?? "none", letterSpacing: FONT_TRACKING[i] ?? "normal" }}
                        >
                          {name}
                        </button>
                      ))}
                      </div>
                      <Tip label="Text colour" className="mt-3">
                        <div onPointerDown={dragTextSV} onPointerMove={(e) => e.buttons === 1 && dragTextSV(e)} className="relative h-20 w-full cursor-crosshair touch-none rounded-lg" style={{ background: SV_GRAD(`hsl(${fontHue} 100% 50%)`) }}>
                          <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${fontSat * 100}%`, top: `${(1 - fontVal) * 100}%`, background: textSwatch, opacity: textColorActive ? 1 : 0.85 }} />
                        </div>
                      </Tip>
                      <div onPointerDown={dragTextHue} onPointerMove={(e) => e.buttons === 1 && dragTextHue(e)} className="relative mt-2.5 h-3 w-full cursor-pointer touch-none rounded-md" style={{ background: HUE_BAR }}>
                        <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${(fontHue / 360) * 100}%`, background: `hsl(${fontHue} 100% 50%)` }} />
                      </div>
                    </>
                  )}
                </div>
            </motion.div>
          </ToolbarPanel>
        </motion.div>
      </div>
    </>
  );
}
