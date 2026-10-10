import { cn } from "@/lib/utils";

/**
 * Inline SVG country flags. Emoji flags do not render on Windows/Chrome (they fall
 * back to two-letter codes), so these are drawn as real vector flags.
 *
 * At rest the three flags sit in an overlapping stack (like a pile of cards);
 * hovering the group fans them out into a flat, evenly-spaced row.
 */

// No size here — each flag is sized in the stack below (all equal) so the pile
// reads as a tidy overlapping image stack. Border is 2px to match the social
// chips, the post/design asset stacks and the book covers (one shared thickness).
// Border color comes from --flag-border (dark grey in light mode, a light grey
// lifted off the dark background in dark mode). Set inline because a Tailwind
// border-color utility doesn't always make it into the route's CSS chunk.
const FLAG_CLS =
  "block shrink-0 rounded-[3px] border-2 shadow-[0_1px_4px_rgba(0,0,0,0.20)]";
const FLAG_STYLE = { borderColor: "var(--flag-border)" } as const;

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = ((-90 + (i * 180) / points) * Math.PI) / 180;
    const r = i % 2 ? inner : outer;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function USFlag({ className }: { className?: string }) {
  const stripe = 10 / 13;
  const whites = [1, 3, 5, 7, 9, 11].map((i) => (
    <rect key={i} y={i * stripe} width="19" height={stripe} fill="#fff" />
  ));
  const stars = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      stars.push(<circle key={`${r}-${c}`} cx={1 + c * 1.9} cy={1 + r * 1.7} r="0.42" fill="#fff" />);
    }
  }
  return (
    <svg viewBox="0 0 19 10" className={cn(FLAG_CLS, className)} style={FLAG_STYLE} preserveAspectRatio="none" aria-hidden>
      <rect width="19" height="10" fill="#B22234" />
      {whites}
      <rect width="8" height={stripe * 7} fill="#3C3B6E" />
      {stars}
    </svg>
  );
}

function FRFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 9 6" className={cn(FLAG_CLS, className)} style={FLAG_STYLE} preserveAspectRatio="none" aria-hidden>
      <rect width="3" height="6" fill="#0055A4" />
      <rect x="3" width="3" height="6" fill="#fff" />
      <rect x="6" width="3" height="6" fill="#EF4135" />
    </svg>
  );
}

function MYFlag({ className }: { className?: string }) {
  const whites = [1, 3, 5, 7, 9, 11, 13].map((i) => (
    <rect key={i} y={i} width="28" height="1" fill="#fff" />
  ));
  return (
    <svg viewBox="0 0 28 14" className={cn(FLAG_CLS, className)} style={FLAG_STYLE} preserveAspectRatio="none" aria-hidden>
      <rect width="28" height="14" fill="#CC0001" />
      {whites}
      <rect width="14" height="8" fill="#010066" />
      {/* crescent: a yellow disc with a blue disc bitten out */}
      <circle cx="6" cy="4.2" r="2.7" fill="#FFCC00" />
      <circle cx="7.2" cy="4.2" r="2.15" fill="#010066" />
      {/* federal star */}
      <polygon points={starPoints(10, 4.6, 1.9, 0.78, 5)} fill="#FFCC00" />
    </svg>
  );
}

const EASE = "duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]";

export function Flags({ className }: { className?: string }) {
  return (
    <span
      className={cn("group/flags inline-flex items-center", className)}
      aria-label="United States, France, Malaysia"
    >
      {/* Equal-size flags in an overlapping pile; US sits in front. */}
      <USFlag className={cn("relative z-30 h-[30px] w-[45px] origin-bottom transition-transform", EASE, "-rotate-6 group-hover/flags:rotate-0")} />
      <FRFlag className={cn("relative z-20 h-[30px] w-[45px] origin-bottom transition-[margin,transform]", EASE, "-ml-6 rotate-3 group-hover/flags:ml-2 group-hover/flags:rotate-0")} />
      <MYFlag className={cn("relative z-10 h-[30px] w-[45px] origin-bottom transition-[margin,transform]", EASE, "-ml-6 -rotate-3 group-hover/flags:ml-2 group-hover/flags:rotate-0")} />
    </span>
  );
}
