"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * FreeTag — a realistic manila hang-tag pinned into the top-right corner of a
 * panel. It hangs on a twine string with elastic (rubber-band) physics. Grab
 * it and it tugs toward the cursor, the string stretching; let go and it
 * snaps back and settles straight down. Drag is the ONLY interaction — no
 * hover/repel. Pure rAF sim.
 *
 * Drop inside a `relative` container; it overlays and passes pointer events
 * through except on the tag itself.
 */
export function FreeTag({
  label = "Drag me",
  className,
}: {
  /** Text printed on the manila card. */
  label?: string;
  /** Extra classes for the absolute-positioned overlay wrapper. */
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dragging = useRef(false);

  const sim = useRef({
    px: 0, py: 0, // pivot (string anchor)
    x: 0, y: 0, // tag attach point
    vx: 0, vy: 0,
    mx: 0, my: 0, // pointer during a drag, local coords
    L: 40, // rest string length
    init: false,
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const tag = tagRef.current;
    const line = lineRef.current;
    if (!wrap || !tag || !line) return;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      const s = sim.current;
      s.px = r.width - 24;
      s.py = 12;
      if (!s.init) {
        s.x = s.px;
        s.y = s.py + s.L;
        s.init = true;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const render = () => {
      const s = sim.current;
      line.setAttribute("x1", String(s.px));
      line.setAttribute("y1", String(s.py));
      line.setAttribute("x2", String(s.x));
      line.setAttribute("y2", String(s.y));
      const ang = (Math.atan2(s.y - s.py, s.x - s.px) * 180) / Math.PI - 90;
      tag.style.transform = `translate(${s.x}px, ${s.y}px) translateX(-50%) rotate(${ang}deg)`;
      tag.style.opacity = "1";
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      render();
      return () => ro.disconnect();
    }

    let raf = 0;
    const step = () => {
      const s = sim.current;
      if (dragging.current) {
        // tug toward the pointer with a springy grip
        s.vx += (s.mx - s.x) * 0.3;
        s.vy += (s.my - s.y) * 0.3;
      } else {
        // elastic twine: a soft pull toward rest length lets it stretch and
        // rubber-band back; gravity settles it straight down.
        const dx = s.x - s.px;
        const dy = s.y - s.py;
        const d = Math.hypot(dx, dy) || 0.0001;
        const stretch = d - s.L;
        s.vx += -0.12 * stretch * (dx / d);
        s.vy += -0.12 * stretch * (dy / d);
        s.vy += 0.7; // gravity
      }
      s.vx *= 0.9;
      s.vy *= 0.9;
      s.x += s.vx;
      s.y += s.vy;
      render();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const toLocal = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      sim.current.mx = e.clientX - r.left;
      sim.current.my = e.clientY - r.top;
    };
    const onDown = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragging.current = true;
      toLocal(e);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging.current) toLocal(e);
    };
    const onUp = () => {
      dragging.current = false;
    };

    tag.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      tag.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn("pointer-events-none absolute inset-0 z-30", className)}>
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <line ref={lineRef} style={{ stroke: "#9a8c73" }} strokeWidth={1.6} strokeLinecap="round" />
      </svg>
      {/* pivot — a small pin the twine is tied to */}
      <span
        aria-hidden
        className="absolute h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.35)]"
        style={{ left: "calc(100% - 24px)", top: 12 }}
      />
      {/* realistic manila card tag */}
      <div
        ref={tagRef}
        onClick={(e) => e.stopPropagation()}
        style={{ transformOrigin: "50% 0%", willChange: "transform", opacity: 0 }}
        className="pointer-events-auto absolute left-0 top-0 flex cursor-grab touch-none select-none flex-col items-center active:cursor-grabbing"
      >
        {/* brass eyelet the twine threads through */}
        <span className="relative z-10 -mb-[4px] h-[10px] w-[10px] rounded-full border-2 border-[#b7a67f] bg-[#efe7d6] shadow-[0_1px_1px_rgba(0,0,0,0.2)] dark:bg-[#3a352c]" />
        {/* card body — kraft paper with a soft shadow */}
        <span className="relative rounded-[5px] rounded-t-[9px] border border-[#d8cbb0] bg-[#f1e9d8] px-2.5 pb-[4px] pt-[7px] text-[10px] font-bold tracking-wide text-[#6a5d40] shadow-[0_5px_12px_rgba(0,0,0,0.16)] dark:border-[#524a3a] dark:bg-[#413a2e] dark:text-[#e7dcc4]">
          {label}
        </span>
      </div>
    </div>
  );
}
