"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ArrowClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * A ghost hand writes "Welcome to my site, i'm Samuel" in white marker on the
 * whiteboard (the gif). Two modes:
 *  - Library/demo (`controls`): a frosted play/pause/replay control drives a
 *    write -> hold -> scrub-erase -> replay loop.
 *  - Reading gif (`interactive`, `autoPlay`, no `autoErase`): it writes once, the
 *    marker rests exactly on the end of the last "l", and it does NOT auto-erase.
 *    Hovering the marker pops a chat bubble ("double click to use me..."); double
 *    clicking picks it up to draw freehand. A whiteboard eraser rests in the
 *    corner: grab and drag it to rub the board out by hand.
 *
 * Engineering: frame-driven off one timeline `t`; stroke timing is measured from
 * each path's real arc length (getTotalLength) so the pen holds constant velocity
 * and the marker tip sits exactly on the wet ink; the marker lifts and glides
 * between letters.
 */
const GLYPH: Record<string, { adv: number; s: string[] }> = {
  W: { adv: 40, s: ["M0,30 L9,90 L18,48 L27,90 L36,30"] },
  e: { adv: 29, s: ["M3,72 L19,72 C22,72 22,64 17,60 C11,56 2,58 1,68 C0,78 7,86 18,85 C22,85 25,83 27,80"] },
  l: { adv: 12, s: ["M2,26 C0,48 0,68 0,88 C0,91 3,92 7,89"] },
  c: { adv: 24, s: ["M22,60 C16,54 4,55 3,68 C2,80 14,85 23,80"] },
  o: { adv: 27, s: ["M14,56 C5,56 1,66 4,76 C7,85 19,85 23,76 C27,66 23,56 14,56"] },
  m: { adv: 40, s: ["M3,54 C2,68 2,80 3,90", "M3,63 C4,55 10,52 16,55 C20,57 19,73 19,90", "M19,63 C20,55 26,52 32,55 C36,57 35,73 35,90"] },
  t: { adv: 17, s: ["M8,40 C7,58 6,74 8,88 C9,91 13,91 16,88", "M1,54 L15,54"] },
  y: { adv: 27, s: ["M2,52 C3,66 6,78 13,80 C18,81 21,74 22,60", "M22,52 C21,70 20,92 14,104 C10,110 4,108 1,103"] },
  s: { adv: 26, s: ["M22,58 C16,52 6,54 6,62 C6,68 16,68 20,74 C24,80 18,88 8,86 C4,85 1,82 0,79"] },
  i: { adv: 13, s: ["M2,52 C3,66 2,78 4,90", "M1,42 q3,-3 6,0"] },
  ",": { adv: 10, s: ["M4,84 C5,89 4,96 1,100"] },
  "'": { adv: 8, s: ["M3,30 C3,36 2,41 1,45"] },
  S: { adv: 26, s: ["M22,40 C16,34 5,36 5,46 C5,54 17,56 21,64 C25,72 16,82 6,79 C3,78 1,75 1,72"] },
  a: { adv: 26, s: ["M20,56 C12,52 2,56 1,68 C0,79 10,86 18,80 C21,78 21,66 20,56 C20,72 20,82 24,90"] },
  u: { adv: 27, s: ["M2,52 C2,68 0,80 7,84 C14,88 21,80 21,62 C21,76 21,84 25,90"] },
  " ": { adv: 15, s: [] },
};

const PHRASE = "Welcome to my site, i'm Samuel";
const SPACING = 4;
const MARGIN = 16;
const INK = "#f8fafc";

type Glyph = { x: number; dy: number; rot: number; cx: number; strokes: { d: string }[] };

const { GLYPHS, FLAT, VBW } = (() => {
  let x = MARGIN;
  let gi = 0;
  const glyphs: Glyph[] = [];
  const flat: { g: Glyph; d: string; i: number }[] = [];
  for (const ch of PHRASE) {
    const g = GLYPH[ch];
    if (!g) {
      x += 20;
      continue;
    }
    const j1 = ((gi * 73) % 100) / 100;
    const j2 = ((gi * 127 + 31) % 100) / 100;
    const glyph: Glyph = { x, dy: (j1 - 0.5) * 5.4, rot: (j2 - 0.5) * 4.6, cx: g.adv / 2, strokes: [] };
    for (const d of g.s) {
      glyph.strokes.push({ d });
      flat.push({ g: glyph, d, i: flat.length });
    }
    glyphs.push(glyph);
    x += g.adv + SPACING;
    gi++;
  }
  return { GLYPHS: glyphs, FLAT: flat, VBW: Math.ceil(x + MARGIN) };
})();
const STROKE_GLYPH = new Map(FLAT.map((f) => [f, f.g]));

const ERASE = 1600;
const PASSES = 3;
const NBLOB = 58;
const FADE = 200;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const eio = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
function scrubPos(u: number) {
  const pass = Math.min(PASSES - 1, Math.floor(u * PASSES));
  const q = u * PASSES - pass;
  const dir = pass % 2 === 0;
  const x = dir ? -14 + eio(q) * (VBW + 28) : VBW + 14 - eio(q) * (VBW + 28);
  const y = 42 + pass * 20 + Math.sin(u * Math.PI * 8) * 3;
  const rot = -6 + Math.sin(u * Math.PI * 6) * 3.5;
  return { x, y, rot };
}
const SAMPLES = Array.from({ length: NBLOB }, (_, i) => {
  const u = i / (NBLOB - 1);
  return { ...scrubPos(u), tAt: u * ERASE + (((i * 53) % 7) - 3) * 24 };
});

const HOLD = 1200;
const MSPU = 1.7;
const EST = 200;

type Metric = { len: number; start: [number, number]; end: [number, number] };
type Step = { g: Glyph; d: string; draw: number; dur: number; travel: number; from: [number, number] | null; to: [number, number] };
type Status = "idle" | "running" | "done";

const MARKER = (
  <>
    <line x1="4" y1="-4" x2="27" y2="-29" stroke="#f8fafc" strokeWidth="11" strokeLinecap="round" />
    <line x1="6" y1="-6" x2="25" y2="-27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <line x1="23" y1="-25" x2="31" y2="-34" stroke="#64748b" strokeWidth="11" strokeLinecap="round" />
    <path d="M0,0 L9,-3 L3,-9 Z" fill="#334155" />
    <path d="M0,0 L6,-2 L2,-6 Z" fill="#0f172a" />
  </>
);
const ERASER = (
  <>
    <rect x={-16} y={-22} width={32} height={36} rx={5} fill="#e5e7eb" />
    <rect x={-16} y={-22} width={32} height={8} rx={4} fill="#f3f4f6" />
    <rect x={-16} y={8} width={32} height={10} rx={4} fill="#64748b" />
    <rect x={-16} y={8} width={32} height={3} fill="#475569" />
  </>
);

export function HandWrite({
  className,
  controls = true,
  autoPlay = false,
  autoErase = true,
  interactive = false,
}: {
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  autoErase?: boolean;
  interactive?: boolean;
}) {
  const [reduced, setReduced] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const tRef = useRef(0);
  const lastRef = useRef(0);
  const totalRef = useRef(1);
  const svgRef = useRef<SVGSVGElement>(null);

  // interactive: freehand draw + hand erase
  const [drawMode, setDrawMode] = useState(false);
  const [hoverMarker, setHoverMarker] = useState(false);
  const [userStrokes, setUserStrokes] = useState<string[]>([]);
  const [live, setLive] = useState<string | null>(null);
  const [markerPt, setMarkerPt] = useState<[number, number] | null>(null);
  const ptsRef = useRef<[number, number][]>([]);
  const [eraserPt, setEraserPt] = useState<[number, number]>([VBW - 30, 112]);
  const [erasing, setErasing] = useState(false);
  const [manualBlobs, setManualBlobs] = useState<[number, number][]>([]);

  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  useEffect(() => {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
    document.body.appendChild(svg);
    const out = FLAT.map((s) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", s.d);
      svg.appendChild(p);
      const len = p.getTotalLength() || 1;
      const a = p.getPointAtLength(0);
      const b = p.getPointAtLength(len);
      return { len, start: [s.g.x + a.x, a.y] as [number, number], end: [s.g.x + b.x, b.y] as [number, number] };
    });
    document.body.removeChild(svg);
    setMetrics(out);
  }, []);

  const tl = useMemo(() => {
    const steps: Step[] = [];
    let cur = 0;
    let prev: [number, number] | null = null;
    FLAT.forEach((s) => {
      const m = metrics?.[s.i];
      const dur = m ? Math.max(80, m.len * MSPU) : EST;
      const to: [number, number] = m ? m.start : [s.g.x, 70];
      const travel = prev ? Math.min(240, 55 + Math.hypot(to[0] - prev[0], to[1] - prev[1]) * 2.6) : 0;
      const draw = cur + travel;
      steps.push({ g: s.g, d: s.d, draw, dur, travel, from: prev, to });
      cur = draw + dur;
      prev = m ? m.end : [s.g.x + 10, 80];
    });
    const writeEnd = cur;
    const total = autoErase ? writeEnd + HOLD + ERASE + FADE + 200 : writeEnd;
    return { steps, writeEnd, holdEnd: writeEnd + HOLD, total };
  }, [metrics, autoErase]);
  totalRef.current = tl.total;

  // auto-play on mount (once metrics are ready) when there is no control button
  const startedRef = useRef(false);
  useEffect(() => {
    if (autoPlay && metrics && !startedRef.current && !reduced) {
      startedRef.current = true;
      setStatus("running");
      setPlaying(true);
    }
  }, [autoPlay, metrics, reduced]);

  useEffect(() => {
    if (!playing) {
      lastRef.current = 0;
      return;
    }
    let raf = requestAnimationFrame(function step(now) {
      if (!lastRef.current) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;
      let nt = tRef.current + dt;
      if (nt >= totalRef.current) {
        nt = totalRef.current;
        tRef.current = nt;
        setT(nt);
        setPlaying(false);
        setStatus("done");
        return;
      }
      tRef.current = nt;
      setT(nt);
      raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const onControl = () => {
    if (status === "running" && playing) {
      setPlaying(false);
      return;
    }
    if (status === "done") {
      tRef.current = 0;
      setT(0);
    }
    setStatus("running");
    setPlaying(true);
  };

  // ---- pointer -> svg coords ----
  const toSvg = (e: React.PointerEvent): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return [p.x, p.y];
  };

  const written = status === "done" && !autoErase;

  // ---- derive frame ----
  const tE = t - tl.holdEnd;
  const autoErasing = autoErase && !reduced && tE >= 0;

  const inkOff = (i: number) => {
    if (reduced) return 0;
    const s = tl.steps[i];
    return 1 - eio(clamp01((t - s.draw) / s.dur));
  };

  // marker: drawing a stroke, gliding, resting on the last "l", or held by user
  let marker: { local?: { d: string; p: number; g: Glyph }; x?: number; y?: number; lift?: number } | null = null;
  if (drawMode && markerPt) {
    marker = { x: markerPt[0], y: markerPt[1], lift: 0 };
  } else if (!reduced && t < tl.writeEnd) {
    for (let i = 0; i < tl.steps.length; i++) {
      const s = tl.steps[i];
      if (t >= s.draw && t < s.draw + s.dur) {
        marker = { local: { d: s.d, p: eio(clamp01((t - s.draw) / s.dur)), g: s.g } };
        break;
      }
      if (s.travel > 0 && t >= s.draw - s.travel && t < s.draw && s.from) {
        const u = eio(clamp01((t - (s.draw - s.travel)) / s.travel));
        marker = { x: s.from[0] + (s.to[0] - s.from[0]) * u, y: s.from[1] + (s.to[1] - s.from[1]) * u, lift: Math.sin(u * Math.PI) };
        break;
      }
    }
  } else if (written && tl.steps.length) {
    const last = tl.steps[tl.steps.length - 1];
    marker = { local: { d: last.d, p: 1, g: last.g } };
  }

  const eraserVisible = autoErasing ? scrubPos(clamp01(tE / ERASE)) : null;

  const Icon = status === "done" ? ArrowClockwise : status === "running" && playing ? Pause : Play;
  const label = status === "done" ? "Replay" : status === "running" && playing ? "Pause" : "Play";

  const captureOn = interactive && written && (drawMode || erasing);

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} 130`}
        className="absolute left-5 top-4 h-auto w-[280px] overflow-visible sm:left-6 sm:top-5 sm:w-[440px]"
        aria-label="Welcome to my site, I'm Samuel"
      >
        <defs>
          <mask id="hw-erase">
            <rect x={-40} y={-40} width={VBW + 80} height={210} fill="#fff" />
            {autoErasing &&
              SAMPLES.map((s, i) => {
                const o = clamp01((tE - s.tAt) / FADE);
                return o <= 0 ? null : <rect key={i} x={s.x - 15} y={s.y - 20} width={30} height={40} rx={8} fill="#000" opacity={o} transform={`rotate(${s.rot} ${s.x} ${s.y})`} />;
              })}
            {manualBlobs.map(([x, y], i) => (
              <circle key={`m${i}`} cx={x} cy={y} r={18} fill="#000" />
            ))}
          </mask>
        </defs>

        {/* capture layer while drawing / erasing */}
        {captureOn && (
          <rect
            x={-40}
            y={-40}
            width={VBW + 80}
            height={210}
            fill="transparent"
            className="pointer-events-auto"
            style={{ cursor: erasing ? "grabbing" : "crosshair" }}
            onPointerMove={(e) => {
              const p = toSvg(e);
              if (!p) return;
              if (drawMode && ptsRef.current.length) {
                ptsRef.current.push(p);
                setMarkerPt(p);
                setLive("M" + ptsRef.current.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L"));
              } else if (drawMode) {
                setMarkerPt(p);
              }
              if (erasing) {
                setEraserPt(p);
                setManualBlobs((b) => [...b, p]);
              }
            }}
            onPointerDown={(e) => {
              const p = toSvg(e);
              if (!p) return;
              if (drawMode) {
                ptsRef.current = [p];
                setMarkerPt(p);
              }
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
            onPointerUp={() => {
              if (drawMode && ptsRef.current.length > 1) {
                setUserStrokes((s) => [...s, "M" + ptsRef.current.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")]);
              }
              ptsRef.current = [];
              setLive(null);
              setErasing(false);
            }}
          />
        )}

        <g mask="url(#hw-erase)">
          {GLYPHS.map((g, gi) => (
            <g key={gi} transform={`translate(${g.x} ${g.dy}) rotate(${g.rot} ${g.cx} 82)`}>
              {g.strokes.map((st, si) => {
                const idx = FLAT.findIndex((f) => f.g === g && f.d === st.d);
                return (
                  <path
                    key={si}
                    d={st.d}
                    fill="none"
                    stroke={INK}
                    strokeWidth={5.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    style={{ strokeDasharray: 1, strokeDashoffset: inkOff(idx), filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }}
                  />
                );
              })}
            </g>
          ))}
          {/* user's freehand ink */}
          {userStrokes.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
          ))}
          {live && <path d={live} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />}
        </g>

        {/* marker */}
        {marker &&
          (marker.local ? (
            <g
              transform={`translate(${marker.local.g.x} ${marker.local.g.dy}) rotate(${marker.local.g.rot} ${marker.local.g.cx} 82)`}
              className={interactive && written ? "pointer-events-auto cursor-grab" : ""}
              onPointerEnter={() => interactive && written && setHoverMarker(true)}
              onPointerLeave={() => setHoverMarker(false)}
              onDoubleClick={() => interactive && written && setDrawMode((d) => !d)}
            >
              <g style={{ offsetPath: `path('${marker.local.d}')`, offsetDistance: `${marker.local.p * 100}%`, offsetRotate: "0deg", offsetAnchor: "0% 100%" }}>{MARKER}</g>
            </g>
          ) : (
            <g transform={`translate(${marker.x} ${marker.y}) scale(${1 + (marker.lift ?? 0) * 0.06})`} opacity={0.92}>
              {MARKER}
            </g>
          ))}

        {/* auto scrub eraser */}
        {eraserVisible && (
          <g transform={`translate(${eraserVisible.x} ${eraserVisible.y}) rotate(${eraserVisible.rot})`} aria-hidden>
            {ERASER}
          </g>
        )}

        {/* resting, grabbable eraser (interactive, after writing) */}
        {interactive && written && (
          <g
            transform={`translate(${eraserPt[0]} ${eraserPt[1]})`}
            className="pointer-events-auto cursor-grab"
            onPointerDown={(e) => {
              setErasing(true);
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
          >
            {ERASER}
          </g>
        )}

        {/* chat-bubble tooltip on the marker */}
        {interactive && written && hoverMarker && !drawMode && marker?.local && (
          <g transform={`translate(${marker.local.g.x + 6} ${marker.local.g.dy - 26})`} className="pointer-events-none">
            <rect x={-6} y={-20} width={168} height={26} rx={8} fill="#ffffff" />
            <path d="M6,6 l7,0 l-9,8 z" fill="#ffffff" />
            <text x={78} y={-2} textAnchor="middle" fontSize="12" fontFamily="var(--font-inter), sans-serif" fill="#111">
              double click to use me...
            </text>
          </g>
        )}
      </svg>

      {controls && !reduced && (
        <button
          type="button"
          onClick={onControl}
          aria-label={label}
          className="pointer-events-auto absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] duration-150 [@media(hover:hover)]:hover:bg-white/20 active:scale-90 sm:right-6 sm:top-5"
        >
          <Icon size={15} weight={status === "done" ? "bold" : "fill"} className={label === "Play" ? "ml-0.5" : ""} />
        </button>
      )}
    </div>
  );
}
