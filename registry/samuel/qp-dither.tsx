"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The qp dithered mark, ported from the qp site. A Bayer 4x4 ordered dither of
 * the blackletter logo: every kept pixel becomes a dot that scatters out on load
 * and converges (center outward), breathes on its own phase, and eases away from
 * the cursor. One putImageData buffer per frame, so it holds 60fps.
 *
 * Colored by the current `text-*` color (read as rgb), so it inverts cleanly
 * between light and dark. Honors prefers-reduced-motion.
 */
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const SIZE = 400;
const BLOCK = 2;
const SIGNAL = 0.78;
const OUT = 2;
const R_SIZE = SIZE * OUT;
const R_BLOCK = BLOCK * OUT;
const ASSEMBLE_MS = 1100;
const REPEL_R = 64;
const REPEL_MAX = 11;

export function QpDither({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = R_SIZE;
    canvas.height = R_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Resolve the ink color from the element's computed color — always rgb().
    const rgb = getComputedStyle(canvas).color.match(/\d+/g)?.map(Number) ?? [23, 23, 23];
    const [fgR, fgG, fgB] = rgb;

    const pointer = { x: -1e4, y: -1e4 };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * SIZE;
      pointer.y = ((e.clientY - rect.top) / rect.height) * SIZE;
    };
    const onLeave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
    };
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let cancelled = false;

    const img = new Image();
    img.src = "/design/qp/qp-gothic.png";
    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement("canvas");
      off.width = SIZE;
      off.height = SIZE;
      const offCtx = off.getContext("2d");
      if (!offCtx) return;
      // White base so a transparent OR white background both read as "not logo".
      offCtx.fillStyle = "#fff";
      offCtx.fillRect(0, 0, SIZE, SIZE);
      offCtx.drawImage(img, 0, 0, SIZE, SIZE);
      const { data } = offCtx.getImageData(0, 0, SIZE, SIZE);

      const cols = SIZE / BLOCK;
      const rows = SIZE / BLOCK;
      const mask = new Uint8Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * BLOCK * SIZE + c * BLOCK) * 4;
          const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          mask[r * cols + c] = lum < 0.35 ? 1 : 0;
        }
      }

      const cx = cols / 2;
      const cy = rows / 2;
      const maxR = Math.hypot(cx, cy);
      const dots: Array<{
        x: number; y: number; sx: number; sy: number; delay: number;
        angle: number; phase: number; freq: number; amp: number;
        r: number; g: number; b: number; rx: number; ry: number;
      }> = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!mask[r * cols + c]) continue;
          const threshold = (BAYER4[r % 4][c % 4] + 0.5) / 16;
          if (SIGNAL <= threshold) continue;

          let isEdge = false;
          outer: for (let dr = -3; dr <= 3; dr++) {
            for (let dc = -3; dc <= 3; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || !mask[nr * cols + nc]) {
                isEdge = true;
                break outer;
              }
            }
          }

          const angle = Math.atan2(r - cy, c - cx);
          const tone = 0.5 + 0.5 * Math.random() * Math.random() + (Math.random() < 0.06 ? 0.25 : 0);
          const scatter = 40 + Math.random() * 150;
          dots.push({
            x: c * BLOCK,
            y: r * BLOCK,
            sx: c * BLOCK + Math.cos(angle) * scatter,
            sy: r * BLOCK + Math.sin(angle) * scatter,
            delay: (Math.hypot(c - cx, r - cy) / maxR) * 700 + Math.random() * 300,
            angle,
            phase: Math.random() * Math.PI * 2,
            freq: 0.0003 + Math.random() * 0.00025,
            amp: isEdge ? 5 + Math.random() * 10 : 0.5 + Math.random() * 1.5,
            r: Math.min(255, Math.round(fgR * tone)),
            g: Math.min(255, Math.round(fgG * tone)),
            b: Math.min(255, Math.round(fgB * tone)),
            rx: 0,
            ry: 0,
          });
        }
      }

      const buf = ctx.createImageData(R_SIZE, R_SIZE);
      const pix = buf.data;
      let startT: number | undefined;

      const frame = (t: number) => {
        if (cancelled) return;
        if (startT === undefined) startT = t;
        const elapsed = t - startT;
        pix.fill(0);

        for (const d of dots) {
          let p = 1;
          if (!reduceMotion) {
            p = Math.min(1, Math.max(0, (elapsed - d.delay) / ASSEMBLE_MS));
            p = 1 - Math.pow(1 - p, 3);
          }

          const wave = Math.sin(t * d.freq + d.phase);
          const amp = reduceMotion ? Math.min(d.amp, 1.5) : d.amp;
          const bx = Math.cos(d.angle) * amp * wave * p;
          const by = Math.sin(d.angle) * amp * wave * p;

          let tx = 0;
          let ty = 0;
          if (!reduceMotion) {
            const dx = d.x - pointer.x;
            const dy = d.y - pointer.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < REPEL_R * REPEL_R) {
              const dist = Math.sqrt(dist2) || 1;
              const f = 1 - dist / REPEL_R;
              const push = f * f * REPEL_MAX;
              tx = (dx / dist) * push;
              ty = (dy / dist) * push;
            }
            d.rx += (tx - d.rx) * 0.13;
            d.ry += (ty - d.ry) * 0.13;
          }

          const hx = d.sx + (d.x - d.sx) * p;
          const hy = d.sy + (d.y - d.sy) * p;
          const px = Math.round((hx + bx + d.rx) * OUT);
          const py = Math.round((hy + by + d.ry) * OUT);
          if (px < 0 || py < 0 || px + R_BLOCK > R_SIZE || py + R_BLOCK > R_SIZE) continue;

          const a = Math.round(255 * p);
          for (let by2 = 0; by2 < R_BLOCK; by2++) {
            for (let bx2 = 0; bx2 < R_BLOCK; bx2++) {
              const i = ((py + by2) * R_SIZE + (px + bx2)) * 4;
              pix[i] = d.r;
              pix[i + 1] = d.g;
              pix[i + 2] = d.b;
              pix[i + 3] = a;
            }
          }
        }
        ctx.putImageData(buf, 0, 0);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="qp dithered mark"
      className={cn("h-full w-full text-foreground", className)}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
