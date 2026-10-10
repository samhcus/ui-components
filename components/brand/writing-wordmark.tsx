import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

// The handwriting face the Samuel signature originally wore — reused here so
// "My writing" reads in the same personal hand.
const signature = Caveat({ subsets: ["latin"], weight: "700" });

/**
 * "Writing" wordmark — set in the Caveat handwriting hand, with a single
 * hand-drawn blue squiggle under the word (in the house blue). Scales with
 * font-size (em-based underline); reads at nav or heading size.
 */
export function WritingWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        signature.className,
        // next/font hashed class misses the globals.css opt-out selectors, so the
        // font switcher's body font-size-adjust would rescale Caveat. Pin it.
        "[font-size-adjust:none]",
        "relative inline-block select-none leading-none tracking-tight text-foreground",
        className
      )}
      aria-label="Writing"
    >
      Writing
      <svg
        aria-hidden
        viewBox="0 0 40 8"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full overflow-visible"
      >
        <path
          d="M1 5 C 8 2, 14 7, 20 4 S 32 2, 39 5"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
