"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "motion/react";

/**
 * The element that currently owns the page's vertical scroll: the top-most open
 * full-page post overlay (`[data-overlay]`, which is `fixed inset-0 overflow-y-auto`),
 * or null when the document itself is the scroller. Lets viewport toys (the cat,
 * its poop, ink) anchor to whatever is actually scrolling, so they pin to the post
 * content instead of floating over it.
 */
function useScrollHost() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const read = () => {
      const all = document.querySelectorAll<HTMLElement>("[data-overlay]");
      setHost(all.length ? all[all.length - 1] : null);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return host;
}

/**
 * Oneko — the classic pixel cat that chases the cursor. A faithful port of the
 * frame-by-frame sprite behaviour: it runs toward the pointer in eight directions
 * (two frames each), throws up an "alert" frame the instant it notices you before
 * it commits to the chase, sits when it catches up, and after idling long enough
 * washes itself or curls up to sleep. Poke the cat and it drops a poop that stays,
 * then fades. Reads position from a single 256x128 sprite sheet via background
 * offsets. Desktop only (no cursor to chase on touch); calmed under reduced motion.
 */

// sprite-sheet cells, in 32px units (x, y). Straight from oneko's frame map.
const SPRITES: Record<string, [number, number][]> = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
  scratchWallN: [[0, 0], [0, -1]],
  scratchWallS: [[-7, -1], [-6, -2]],
  scratchWallE: [[-2, -2], [-2, -3]],
  scratchWallW: [[-4, 0], [-4, -1]],
  tired: [[-3, -2]],
  sleeping: [[-2, 0], [-2, -1]],
  N: [[-1, -2], [-1, -3]],
  NE: [[0, -2], [0, -3]],
  E: [[-3, 0], [-3, -1]],
  SE: [[-5, -1], [-5, -2]],
  S: [[-6, -3], [-7, -2]],
  SW: [[-5, -3], [-6, -1]],
  W: [[-4, -2], [-4, -3]],
  NW: [[-1, 0], [-1, -1]],
};

type Poop = { id: number; x: number; y: number };

export function CatCursor({ active }: { active: boolean }) {
  const nekoRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 }); // last cursor, viewport coords (persists across host changes)
  const reactRef = useRef(0); // startled window after a poke
  const poopId = useRef(0);
  const reduce = useReducedMotion();
  const host = useScrollHost(); // the open post overlay that owns scroll, or null
  const [coarse, setCoarse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [poops, setPoops] = useState<Poop[]>([]);

  useEffect(() => setCoarse(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches), []);
  useEffect(() => setMounted(true), []);
  // poops belong to the context they were dropped in — clear them when the scroll
  // host changes (a post opening/closing) so none linger with stale coordinates
  useEffect(() => setPoops([]), [host]);

  // track the cursor globally so the cat keeps its bearings across host swaps
  useEffect(() => {
    cursorRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const onMove = (e: PointerEvent) => { cursorRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    if (!active || coarse) return;
    const neko = nekoRef.current;
    if (!neko) return;

    const SPEED = 14; // px per tick (10fps) — a calm ~140px/s trot
    // The cat lives in the CONTENT space of whatever is scrolling — the document,
    // or the open post overlay. So it stays put on the content as you scroll and has
    // to run to catch back up to the cursor, instead of floating with the viewport.
    const offX = () => (host ? host.scrollLeft : window.scrollX);
    const offY = () => (host ? host.scrollTop : window.scrollY);
    const maxW = () => (host ? host.scrollWidth : document.documentElement.scrollWidth);
    const maxH = () => (host ? host.scrollHeight : document.documentElement.scrollHeight);

    let nekoX = offX() + cursorRef.current.x;
    let nekoY = offY() + cursorRef.current.y;
    let frameCount = 0;
    let idleTime = 0;
    let idleAnim: string | null = null;
    let idleFrame = 0;

    const setSprite = (name: string, frame: number) => {
      const set = SPRITES[name];
      const [sx, sy] = set[(reduce ? 0 : frame) % set.length];
      neko.style.backgroundPosition = `${sx * 32}px ${sy * 32}px`;
    };
    const place = () => {
      neko.style.left = `${(nekoX - 16).toFixed(1)}px`;
      neko.style.top = `${(nekoY - 16).toFixed(1)}px`;
      posRef.current = { x: nekoX, y: nekoY };
    };
    const resetIdle = () => { idleAnim = null; idleFrame = 0; };

    const idle = () => {
      idleTime += 1;
      // occasionally pick a longer idle routine — wash, or curl up to sleep
      if (!reduce && idleTime > 10 && idleAnim == null && Math.floor(Math.random() * 200) === 0) {
        const avail = ["sleeping", "scratchSelf"];
        if (nekoX < 32) avail.push("scratchWallW");
        if (nekoY < 32) avail.push("scratchWallN");
        if (nekoX > maxW() - 32) avail.push("scratchWallE");
        if (nekoY > maxH() - 32) avail.push("scratchWallS");
        idleAnim = avail[Math.floor(Math.random() * avail.length)];
        idleFrame = 0;
      }
      switch (idleAnim) {
        case "sleeping":
          if (idleFrame < 8) { setSprite("tired", 0); break; } // yawn/settle first
          setSprite("sleeping", Math.floor(idleFrame / 4));
          if (idleFrame > 192) resetIdle();
          break;
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnim, idleFrame);
          if (idleFrame > 9) resetIdle();
          break;
        default:
          setSprite("idle", 0);
          return;
      }
      idleFrame += 1;
    };

    const tick = () => {
      frameCount += 1;
      const now = performance.now();

      // just poked → startled for a beat
      if (now < reactRef.current) { setSprite("alert", 0); return; }

      // cursor target in content coords — recomputed every tick, so simply scrolling
      // (cursor still) moves the target and the cat has to run to catch up
      const mouseX = cursorRef.current.x + offX();
      const mouseY = cursorRef.current.y + offY();

      const diffX = nekoX - mouseX;
      const diffY = nekoY - mouseY;
      const dist = Math.hypot(diffX, diffY);

      // close enough → sit / idle behaviours, keeps a gap so it's pokeable
      if (dist < SPEED || dist < 48) { idle(); return; }

      resetIdle();

      // the "decides to follow" beat: after resting, hold an alert frame a few
      // ticks before committing to the chase, then go
      if (idleTime > 1) {
        setSprite("alert", 0);
        idleTime = Math.min(idleTime, 7) - 1;
        return;
      }

      let dir = "";
      dir += diffY / dist > 0.5 ? "N" : "";
      dir += diffY / dist < -0.5 ? "S" : "";
      dir += diffX / dist > 0.5 ? "W" : "";
      dir += diffX / dist < -0.5 ? "E" : "";
      setSprite(dir || "idle", frameCount);

      nekoX -= (diffX / dist) * SPEED;
      nekoY -= (diffY / dist) * SPEED;
      nekoX = Math.max(16, Math.min(maxW() - 16, nekoX));
      nekoY = Math.max(16, Math.min(maxH() - 16, nekoY));
      place();
    };

    place();
    setSprite("idle", 0);
    const id = window.setInterval(tick, 100); // 10fps — the authentic choppy cadence
    return () => window.clearInterval(id);
  }, [active, coarse, reduce, mounted, host]);

  const dropPoop = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reactRef.current = performance.now() + 300; // startled little jump
    // posRef is already in page coords (so is the cat), so the poop stays put on scroll
    const { x, y } = posRef.current;
    const id = ++poopId.current;
    setPoops((p) => [...p, { id, x, y: y + 8 }]);
    window.setTimeout(() => setPoops((p) => p.filter((q) => q.id !== id)), 9000);
  };

  if (!active || coarse) return null;

  return (
    <>
      <style>{`
        .oneko-poop { animation: oneko-poop-in 0.24s var(--ease-out) both, oneko-poop-out 0.6s var(--ease-out) 8.4s both; }
        @keyframes oneko-poop-in { from { transform: scale(0) translateY(-4px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes oneko-poop-out { to { opacity: 0; transform: scale(0.85); } }
        @media (prefers-reduced-motion: reduce) { .oneko-poop { animation: none; } }
      `}</style>

      {mounted && createPortal(
        <>
          {/* absolute + content coords (portalled into the scroll host) so it stays
              where it was dropped and scrolls with the content, like the ink strokes */}
          {poops.map((p) => (
            <div key={p.id} aria-hidden className="oneko-poop pointer-events-none absolute z-[24]" style={{ left: p.x - 7, top: p.y }}>
              <PixelPoop />
            </div>
          ))}

          {/* the cat also lives in page space (absolute), so scrolling leaves it
              behind and it has to run to catch back up to the cursor */}
          <div
            ref={nekoRef}
            role="button"
            tabIndex={-1}
            aria-label="Poke the cat"
            onPointerDown={dropPoop}
            className="absolute left-0 top-0 z-[200] cursor-pointer"
            style={{
              width: 32,
              height: 32,
              backgroundImage: "url(/oneko.png)",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "-96px -96px",
              imageRendering: "pixelated",
            }}
          />
        </>,
        host ?? document.body,
      )}
    </>
  );
}

function PixelPoop() {
  // a tiny pixel-art poop coil to match oneko's aesthetic
  const d = "#6b4a30"; // dark brown
  const l = "#815a3a"; // lighter top
  return (
    <svg width="14" height="12" viewBox="0 0 7 6" style={{ imageRendering: "pixelated", display: "block" }} shapeRendering="crispEdges">
      <rect x="1" y="5" width="5" height="1" fill={d} />
      <rect x="1" y="4" width="5" height="1" fill={d} />
      <rect x="2" y="3" width="4" height="1" fill={d} />
      <rect x="2" y="2" width="3" height="1" fill={l} />
      <rect x="3" y="1" width="2" height="1" fill={l} />
      <rect x="3" y="0" width="1" height="1" fill={l} />
    </svg>
  );
}
