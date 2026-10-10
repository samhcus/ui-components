import { cn } from "@/lib/utils";

/**
 * "Just for fun" wordmark — rounded, friendly Nunito with an italic, hand-underlined
 * "fun". Scales with font-size (em-based underline), so it reads at nav size and as a
 * section heading. Monochrome with a single warm squiggle for personality.
 */
export function JustForFunWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline gap-[0.28em] font-[family-name:var(--font-nunito)] font-extrabold tracking-tight text-foreground",
        className
      )}
      aria-label="Just for fun"
    >
      <span>Just for</span>
      <span className="relative italic">
        fun
        <svg
          aria-hidden
          viewBox="0 0 40 8"
          preserveAspectRatio="none"
          className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full overflow-visible"
        >
          <path
            d="M1 5 C 8 2, 14 7, 20 4 S 32 2, 39 5"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}
