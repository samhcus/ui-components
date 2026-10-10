import { Nunito } from "next/font/google";
import { cn } from "@/lib/utils";

// Rounded, friendly Nunito — pulled via next/font so the mark is self-contained.
const nunito = Nunito({ subsets: ["latin"], weight: ["800"] });

/**
 * ChopsticksWordmark — a rounded, friendly bot lockup: the name in a light-blue
 * Nunito with a small "BOT" badge. Font-size comes from `className`. Pass your
 * own `label`, `badge`, and `color`.
 */
export function ChopsticksWordmark({
  label = "Chopsticks",
  badge = "BOT",
  color = "#7EC8F2",
  className,
}: {
  label?: string;
  badge?: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        nunito.className,
        "inline-flex select-none items-center gap-[0.35em] font-extrabold leading-none tracking-tight",
        className,
      )}
      aria-label={`${label} ${badge}`}
    >
      <span style={{ color }}>{label}</span>
      <span
        className="rounded-[0.28em] font-bold text-white"
        style={{ background: color, fontSize: "0.5em", padding: "0.15em 0.4em" }}
      >
        {badge}
      </span>
    </span>
  );
}

export default ChopsticksWordmark;
