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
  | "mist";

export const EFFECTS: { id: EffectId; label: string }[] = [
  { id: "snow", label: "Snow" },
  { id: "rain", label: "Rain" },
  { id: "embers", label: "Embers" },
  { id: "aurora", label: "Aurora" },
  { id: "dither", label: "Dither" },
  { id: "stars", label: "Stars" },
  { id: "bubbles", label: "Bubbles" },
  { id: "mist", label: "Mist" },
];

type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; life: number; seed: number };

const rnd = () => Math.random();
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

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
  useEffect(() => setMounted(true), []);
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
      sizeRef.current = { w, h, docH };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const iw = Math.max(1, Math.round(w / 5));
      const ih = Math.max(1, Math.round(h / 5));
      const buf = ditherRef.current?.buf ?? document.createElement("canvas");
      buf.width = iw;
      buf.height = ih;
      ditherRef.current = { buf, iw, ih };
      seedForRef.current = null; // reseed: counts scale with the scroller's area
    };
    resize();
    window.addEventListener("resize", resize);
    // The scroller grows/shrinks (fonts, expanding panels, post content) →
    // re-measure. Observe whatever owns the scroll.
    const ro = new ResizeObserver(resize);
    ro.observe(host ?? document.body);

    const ink = () => colorRef.current ?? (darkRef.current ? "255,255,255" : "20,20,20");

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
      else if (id === "embers")
        push(Math.round(area / 22000), () => ({ x: rnd() * w, y: rnd() * docH, r: 0.9 + rnd() * 2.1, vx: (rnd() - 0.5) * 0.2, vy: -(0.3 + rnd() * 0.9), a: 0.20 + rnd() * 0.22, life: rnd(), seed: rnd() * 6.283 }));
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
      partsRef.current = parts;
      seedForRef.current = id;
    };

    let t = 0;
    let prevId: EffectId | null = null;
    let ditherPainted = false;
    let ditherAt = 0;
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

    const stepEmbers = (moving: boolean) => {
      const { w, docH } = sizeRef.current;
      for (const p of partsRef.current) {
        if (moving) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t * 0.9 + p.seed) * 0.25;
          p.life += 0.004;
          if (p.y < 0 || p.life > 1) { p.y = docH - rnd() * 40; p.x = rnd() * w; p.life = 0; }
        }
        const yy = p.y - sy;
        if (!onScreen(yy, p.r + 2)) continue;
        const fade = Math.sin(Math.min(1, p.life) * Math.PI);
        const glow = p.a * (0.5 + 0.5 * Math.sin(t * 3 + p.seed)) * fade;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${colorRef.current ?? "255,150,70"},${glow})`;
        ctx.arc(p.x, yy, p.r, 0, 6.283);
        ctx.fill();
      }
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
          d[i + 3] = v > threshold ? 40 : 0;
        }
      }
      bctx.putImageData(img, 0, 0);
      const { w, h } = sizeRef.current;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, iw, ih, 0, 0, w, h);
    };

    const frame = () => {
      const id = effRef.current;
      sy = hostRef.current ? hostRef.current.scrollTop : window.scrollY || window.pageYOffset || 0;
      op = Math.max(0, Math.min(1, opacityRef.current ?? 1));
      clear();
      if (id !== prevId) { ditherPainted = false; prevId = id; }
      if (id) {
        const moving = !reduceRef.current;
        if (moving) t += 0.016;
        if (id !== "dither" && seedForRef.current !== id) seed(id);
        // One global alpha multiplier scales every effect's draws live (the slider);
        // drawImage (dither) respects it too. Reset after so nothing else inherits it.
        ctx.globalAlpha = op;
        if (id === "snow") stepSnow(moving);
        else if (id === "rain") stepRain(moving);
        else if (id === "embers") stepEmbers(moving);
        else if (id === "stars") stepStars();
        else if (id === "bubbles") stepBubbles(moving);
        else if (id === "aurora") stepBlobs(moving, 1);
        else if (id === "mist") stepBlobs(moving, 0.32);
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
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    let raf = requestAnimationFrame(frame);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
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
  }, [mounted, host]);

  useEffect(() => {
    seedForRef.current = null;
  }, [effect, host]);

  if (!mounted) return null;
  // Portal into whatever owns the scroll — the open post overlay, or the body.
  // `-z-10` sits behind that surface's content but above its (opaque) background,
  // so effects show on the page AND inside posts.
  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: effect ? 1 : 0, transition: reduce ? "none" : "opacity 500ms cubic-bezier(0.23,1,0.32,1)" }}
    />,
    host ?? document.body,
  );
}
