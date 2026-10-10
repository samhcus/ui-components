import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

// An editorial serif italic — reads like an engraved masthead rather than a
// casual signature. One expressive weight, high contrast, premium at large size.
const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

/**
 * "Samuel" wordmark — the name set in a single editorial serif italic. No
 * shadow, no underline. Inherits color from the parent; `className` sets the
 * font-size. Built to run large and centered as a masthead. Swap the label via
 * `children` to reuse the treatment for any name.
 */
export function SamuelWordmark({
  children = "Samuel",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        editorial.className,
        "select-none italic leading-[0.9] tracking-[-0.01em]",
        className,
      )}
      aria-label={typeof children === "string" ? children : "Samuel"}
    >
      {children}
    </span>
  );
}

export default SamuelWordmark;
