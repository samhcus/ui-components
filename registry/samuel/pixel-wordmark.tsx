import { Press_Start_2P } from "next/font/google";
import { cn } from "@/lib/utils";

// Press Start 2P is the classic blocky arcade pixel face — genuinely pixelated,
// unlike faces that only read as a stylized sans.
export const pixelFont = Press_Start_2P({ subsets: ["latin"], weight: "400" });
const pixel = pixelFont;

/** A ready-made playful palette. */
export const PIXEL_COLORS = [
  "#FFD700", "#FF69B4", "#7EC8F2", "#22C55E", "#E63946",
  "#C084FC", "#FF9F1C", "#5B8DB8", "#F472B6",
];

/**
 * PixelWordmark — a colorful pixel-font wordmark where each letter is tinted
 * from a cycling palette. Self-contained: pulls the pixel font via next/font,
 * nothing else. `className` sets the font-size.
 */
export function PixelWordmark({
  text,
  colors = PIXEL_COLORS,
  className,
}: {
  /** The wordmark text. */
  text: string;
  /** Letters cycle through these colors. */
  colors?: string[];
  className?: string;
}) {
  return (
    <span
      className={cn(pixel.className, "[font-size-adjust:none] inline-flex select-none leading-none tracking-[-0.08em]", className)}
      aria-label={text}
    >
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} className="inline-block w-1" />
        ) : (
          <span key={i} style={{ color: colors[i % colors.length] }}>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

export default PixelWordmark;
