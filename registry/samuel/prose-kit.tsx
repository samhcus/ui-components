"use client";

import Image from "next/image";
import { Caveat, Instrument_Serif } from "next/font/google";
import { Tip as BaseTip } from "./tooltip";
import { cn } from "@/lib/utils";

// Two display faces used to make single words pop out of the body copy.
const hand = Caveat({ subsets: ["latin"], weight: "700" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

/* ------------------------------------------------------------------ *
 * Inline rich text
 * ------------------------------------------------------------------ */

// A small, legible palette that holds up in light and dark. A word's colour is
// derived from its own text so it is stable across renders (no hydration drift).
const ACCENT = [
  "#E11D48", "#7C3AED", "#2563EB", "#0891B2",
  "#16A34A", "#EA580C", "#DB2777", "#CA8A04",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * A single word lifted out of the body with a custom font and a colour. Colour
 * defaults to one derived from the word (stable) but can be set explicitly.
 * `font`: "hand" (Caveat) or "serif" (Instrument Serif italic).
 */
export function Accent({
  children,
  font = "serif",
  color,
  className,
}: {
  children: string;
  font?: "hand" | "serif";
  color?: string;
  className?: string;
}) {
  const c = color ?? ACCENT[hash(children) % ACCENT.length];
  return (
    <span
      className={cn(
        font === "hand" ? hand.className : serif.className,
        font === "serif" && "italic",
        "px-[0.06em] text-[1.12em] leading-none",
        className
      )}
      style={{ color: c }}
    >
      {children}
    </span>
  );
}

/** A single word recoloured, keeping the body font. Distinct from Fancy. */
export function Colored({
  children,
  color = "#E11D48",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ color }}>
      {children}
    </span>
  );
}

/** A single word set in a display face, keeping the body colour. */
export function Fancy({
  children,
  font = "serif",
  className,
}: {
  children: string;
  font?: "hand" | "serif";
  className?: string;
}) {
  return (
    <span
      className={cn(
        font === "hand" ? hand.className : serif.className,
        font === "serif" && "italic",
        "text-[1.12em] leading-none",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * An inline word with a hover/focus tooltip. Dotted underline signals it is
 * interactive. Delegates to the one site-wide tooltip primitive (portalled Base
 * UI) so it can never clip against a prose column's `overflow-hidden` and it
 * looks + behaves identically to every other tooltip on the site.
 */
export function Tip({
  children,
  tip,
}: {
  children: React.ReactNode;
  tip: string;
}) {
  return (
    <BaseTip
      label={tip}
      inline
      className="cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-2"
    >
      {children}
    </BaseTip>
  );
}

/* ------------------------------------------------------------------ *
 * Placeholder media — inline SVG "images" in the spirit of the Flags
 * component: real vector marks, never a picsum/lorem URL.
 * ------------------------------------------------------------------ */

type MarkProps = { className?: string };

function ClaudeMark({ className }: MarkProps) {
  // Anthropic-style radial burst of rounded spokes.
  const spokes = Array.from({ length: 12 }).map((_, i) => (
    <rect
      key={i}
      x="49"
      y="18"
      width="2"
      height="20"
      rx="1"
      fill="#D97757"
      transform={`rotate(${i * 30} 50 50)`}
    />
  ));
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {spokes}
    </svg>
  );
}

function LaptopMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="24" y="28" width="52" height="34" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="30" y="34" width="40" height="22" rx="1.5" fill="currentColor" opacity="0.12" />
      <path d="M16 68 h68 l-4 6 H20 z" fill="currentColor" />
    </svg>
  );
}

function TerminalMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="20" y="24" width="60" height="46" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M32 44 l8 6 l-8 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="46" y="52" width="18" height="3" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function CatMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M28 40 L26 22 L42 34 M72 40 L74 22 L58 34" fill="currentColor" opacity="0.9" />
      <circle cx="50" cy="54" r="24" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="42" cy="52" r="2.4" fill="currentColor" />
      <circle cx="58" cy="52" r="2.4" fill="currentColor" />
      <path d="M50 58 v4 M50 62 q-4 3 -8 1 M50 62 q4 3 8 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 56 h-10 M30 60 h-9 M70 56 h10 M70 60 h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

const MARKS = { claude: ClaudeMark, laptop: LaptopMark, terminal: TerminalMark, cat: CatMark };

export type MarkKind = keyof typeof MARKS;

/**
 * A small framed thumbnail of a mark, bordered like the Flags component (black
 * in light, white in dark) so a row of them can stack and fan the same way.
 * An optional badge tags it as a video or gif asset.
 */
export function MarkThumb({
  mark,
  badge,
  className,
}: {
  mark: MarkKind;
  badge?: "video" | "gif";
  className?: string;
}) {
  const Mark = MARKS[mark];
  return (
    <span
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[6px] border border-black bg-background shadow-[0_1px_4px_rgba(0,0,0,0.20)] dark:border-white",
        className
      )}
    >
      <Mark className="h-1/2 w-auto text-foreground/70" />
      {badge === "video" && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span className="ml-[1px] border-y-[4px] border-l-[7px] border-y-transparent border-l-foreground" />
        </span>
      )}
      {badge === "gif" && (
        <span className="absolute bottom-[1px] right-[1px] rounded-[3px] bg-background/85 px-[2px] text-[6px] font-semibold leading-tight text-muted-foreground">
          gif
        </span>
      )}
    </span>
  );
}

/**
 * A real figure image, loaded from a remote host (e.g. Unsplash) through
 * next/image. 16:9 frame with a caption, matching the post's figure rhythm.
 */
export function PostImage({
  src,
  alt,
  caption,
  priority,
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
}) {
  return (
    <figure className="my-8">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          priority={priority}
          className="object-cover"
        />
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * A framed placeholder "image": a vector mark on a soft tinted field with a
 * caption, laid out like a real figure in the post.
 */
export function PlaceholderImage({
  mark,
  caption,
  className,
}: {
  mark: keyof typeof MARKS;
  caption: string;
  className?: string;
}) {
  const Mark = MARKS[mark];
  return (
    <figure className={cn("my-8", className)}>
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_30%,var(--muted),transparent_70%)]">
        <Mark className="h-[38%] w-auto text-foreground/70" />
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * A placeholder video block: a poster field with a play control. Stands in for
 * a real clip until the file is dropped in.
 */
export function PlaceholderVideo({ caption }: { caption: string }) {
  return (
    <figure className="my-8">
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_120%,var(--muted),transparent_70%)]">
        <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-20">
          <CatMark className="h-1/3 w-auto text-foreground" />
          <CatMark className="h-1/3 w-auto -scale-x-100 text-foreground" />
        </div>
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm">
          <span className="ml-1 border-y-[9px] border-l-[15px] border-y-transparent border-l-foreground" />
        </span>
        <span className="absolute bottom-2.5 right-3 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
          video
        </span>
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * A placeholder GIF: two cats that gently bob on a loop to imply motion, with a
 * GIF chip. Respects reduced-motion.
 */
export function PlaceholderGif({ caption }: { caption: string }) {
  return (
    <figure className="my-8">
      <div className="relative flex aspect-[16/9] items-center justify-center gap-10 overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_30%,var(--muted),transparent_70%)]">
        <CatMark className="h-1/3 w-auto text-foreground/70 [animation:catbob_1.4s_ease-in-out_infinite] motion-reduce:animate-none" />
        <CatMark className="h-1/3 w-auto -scale-x-100 text-foreground/70 [animation:catbob_1.4s_ease-in-out_infinite_0.7s] motion-reduce:animate-none" />
        <span className="absolute bottom-2.5 right-3 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
          gif
        </span>
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
      <style>{`@keyframes catbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </figure>
  );
}
