import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

// A handwriting signature face — pairs with an editorial masthead as the
// informal, personal counterpart.
const signature = Caveat({ subsets: ["latin"], weight: "700" });

/**
 * "Writing" wordmark — a word set in a handwriting signature. No underline.
 * Inherits color from the parent; `className` sets the font-size. Swap the label
 * via `children`.
 */
export function WritingWordmark({
  children = "Writing",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        signature.className,
        "[font-size-adjust:none] select-none leading-none text-foreground",
        className
      )}
      aria-label={typeof children === "string" ? children : "Writing"}
    >
      {children}
    </span>
  );
}

export default WritingWordmark;
