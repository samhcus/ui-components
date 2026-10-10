import { Nunito } from "next/font/google";
import { cn } from "@/lib/utils";

// Rounded, friendly Nunito — pulled via next/font so the mark is self-contained.
const nunito = Nunito({ subsets: ["latin"], weight: ["800"] });

/**
 * JustForFunWordmark — a rounded, friendly lockup with an italic, hand-drawn
 * underline squiggle on the last word. The squiggle scales with the type
 * (em-based), so it reads at nav size and as a section heading alike. Monochrome
 * with a single warm accent for personality. Font-size comes from `className`.
 */
export function JustForFunWordmark({
  lead = "Just for",
  accent = "fun",
  color = "#F59E0B",
  className,
}: {
  lead?: string;
  accent?: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        nunito.className,
        "inline-flex select-none items-baseline gap-[0.28em] font-extrabold tracking-tight text-foreground",
        className,
      )}
      aria-label={`${lead} ${accent}`}
    >
      <span>{lead}</span>
      <span className="relative italic">
        {accent}
        <svg
          aria-hidden
          viewBox="0 0 40 8"
          preserveAspectRatio="none"
          className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full overflow-visible"
        >
          <path
            d="M1 5 C 8 2, 14 7, 20 4 S 32 2, 39 5"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}

export default JustForFunWordmark;
