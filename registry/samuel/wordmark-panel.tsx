import { Pixelify_Sans } from "next/font/google";

const pixel = Pixelify_Sans({ subsets: ["latin"], weight: ["600", "700"] });

/** A pixel-font wordmark: each letter tinted from a cycling palette. */
function Wordmark({
  text,
  colors,
  className = "",
}: {
  text: string;
  colors: string[];
  className?: string;
}) {
  return (
    <span
      aria-label={text}
      className={[pixel.className, "inline-flex select-none font-bold leading-none tracking-tight", className]
        .filter(Boolean)
        .join(" ")}
    >
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} className="inline-block w-2" />
        ) : (
          <span key={i} style={{ color: colors[i % colors.length] }}>
            {ch}
          </span>
        )
      )}
    </span>
  );
}

/** A ready-made playful palette. */
export const PIXEL_PALS_COLORS = [
  "#FFD700", "#FF69B4", "#7EC8F2", "#22C55E", "#E63946",
  "#C084FC", "#FF9F1C", "#5B8DB8", "#F472B6",
];

/**
 * A project-style panel titled with a colorful pixel wordmark: a graphic face on
 * top, the wordmark (and optional subtitle) below. Drop any node in as the face.
 * Self-contained — pulls the pixel font via next/font, nothing else.
 */
export function WordmarkPanel({
  text,
  colors = PIXEL_PALS_COLORS,
  subtitle,
  children,
  className = "",
}: {
  /** The wordmark text. */
  text: string;
  /** Letters cycle through these colors. */
  colors?: string[];
  /** Optional line under the wordmark. */
  subtitle?: string;
  /** The graphic that fills the face. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "group flex w-[220px] flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors duration-200 [@media(hover:hover)]:hover:border-foreground/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative h-36 overflow-hidden">
        {children ?? (
          <div
            aria-hidden
            className="h-full w-full"
            style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(0,0,0,0.06), transparent 60%)" }}
          />
        )}
      </div>
      <div className="px-3.5 py-3">
        <Wordmark text={text} colors={colors} className="text-[24px]" />
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default WordmarkPanel;
