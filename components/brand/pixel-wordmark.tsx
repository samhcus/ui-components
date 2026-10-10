import { Press_Start_2P } from "next/font/google";
import { cn } from "@/lib/utils";

// Press Start 2P is the classic blocky arcade pixel face — genuinely pixelated,
// unlike Pixelify Sans which just reads as a stylized sans.
export const pixelFont = Press_Start_2P({ subsets: ["latin"], weight: "400" });
const pixel = pixelFont;

/** Darken a #rrggbb hex toward black by `f` (0..1) — the extruded side face. */
function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

/**
 * A stacked hard-shadow extrusion stepping down-right — the classic blocky-3D
 * arcade look. The side face is a darkened shade of the letter's OWN colour, so
 * the depth reads on both light and dark tiles (a flat black extrusion would sink
 * into a dark card). A faint cast at the base grounds the whole letter.
 */
function extrude3d(color: string): string {
  const side = darken(color, 0.42);
  const steps = [1, 2, 3, 4].map((n) => `${n}px ${n}px 0 ${side}`);
  steps.push("0 6px 5px rgba(0,0,0,0.28)");
  return steps.join(", ");
}

/** A colorful pixel wordmark: each letter tinted from `colors`, cycling, extruded 3D. */
export function PixelWordmark({
  text,
  colors,
  className,
}: {
  text: string;
  colors: string[];
  className?: string;
}) {
  return (
    <span
      className={cn(
        pixel.className,
        // next/font hashed class misses the globals.css opt-out, so the font
        // switcher's body font-size-adjust would crush the pixel face (~48%). Pin it.
        // pr/pb leave room for the extrusion so it never clips against a neighbour.
        "[font-size-adjust:none] inline-flex select-none pb-[6px] pr-[4px] leading-none tracking-[-0.08em]",
        className
      )}
      aria-label={text}
    >
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} className="inline-block w-1" />
        ) : (
          <span
            key={i}
            style={{ color: colors[i % colors.length], textShadow: extrude3d(colors[i % colors.length]) }}
          >
            {ch}
          </span>
        )
      )}
    </span>
  );
}

// Pixel Pals — tinted from the roster crew palette.
export const PIXEL_PALS_COLORS = [
  "#FFD700", "#FF69B4", "#7EC8F2", "#22C55E", "#E63946",
  "#C084FC", "#FF9F1C", "#5B8DB8", "#F472B6",
];
