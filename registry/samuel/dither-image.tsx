"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** 4×4 Bayer matrix for ordered dithering. */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Dither Image — renders any image as a two-tone, Bayer-dithered stipple on a
 * canvas. Ink on paper by default. Downsamples to `pixelSize` blocks, so a small
 * pixelSize is finer (and heavier) than a large one.
 */
export function DitherImage({
  src,
  width = 240,
  height = 240,
  pixelSize = 2,
  colors,
  className,
  alt = "",
}: {
  src: string;
  width?: number;
  height?: number;
  /** Size of each dithered block in px. Larger = chunkier. */
  pixelSize?: number;
  /** Duotone. `light` fills bright regions, `dark` fills shadows. */
  colors?: { light?: string; dark?: string };
  className?: string;
  alt?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const light = colors?.light ?? "#F4F1EA";
  const dark = colors?.dark ?? "#14110D";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = Math.max(1, Math.ceil(width / pixelSize));
    const rows = Math.max(1, Math.ceil(height / pixelSize));

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Downsample the source to one pixel per dither block.
      const sample = document.createElement("canvas");
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext("2d");
      if (!sctx) return;

      // Cover-fit the image into the sample grid.
      const scale = Math.max(cols / img.width, rows / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      sctx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);

      const { data } = sctx.getImageData(0, 0, cols, rows);

      ctx.fillStyle = light;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = dark;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const lum =
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const threshold = (BAYER_4[y % 4][x % 4] + 0.5) * (255 / 16);
          if (lum <= threshold) {
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    };
    img.src = src;
  }, [src, width, height, pixelSize, light, dark]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      role="img"
      aria-label={alt}
      className={cn("block", className)}
      style={{ width, height, imageRendering: "pixelated" }}
    />
  );
}
