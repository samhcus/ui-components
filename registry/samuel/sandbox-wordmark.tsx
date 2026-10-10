import { Nunito } from "next/font/google";
import { cn } from "@/lib/utils";

// Rounded, friendly Nunito — pulled via next/font so the mark is self-contained.
const nunito = Nunito({ subsets: ["latin"], weight: ["800"] });

// A primary toy palette: bucket red, sand amber, shovel blue.
const TOY_COLORS = ["#EF4444", "#F59E0B", "#3B82F6"];

/**
 * SandboxWordmark — a chunky, glossy beach-toy wordmark: soft rounded Nunito,
 * primary toy colors cycling per letter, a gentle alternating tilt, and a drop
 * shadow so the letters read as plastic toys. Font-size comes from `className`.
 */
export function SandboxWordmark({
  text = "Sandbox",
  colors = TOY_COLORS,
  className,
}: {
  text?: string;
  colors?: string[];
  className?: string;
}) {
  return (
    <span
      className={cn(nunito.className, "inline-flex select-none items-end font-extrabold leading-none", className)}
      aria-label={text}
    >
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} className="inline-block w-2" />
        ) : (
          <span
            key={i}
            className="inline-block"
            style={{
              color: colors[i % colors.length],
              transform: `rotate(${i % 2 === 0 ? -4 : 4}deg)`,
              textShadow: "0 2px 0 rgba(0,0,0,0.18)",
            }}
          >
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

export default SandboxWordmark;
