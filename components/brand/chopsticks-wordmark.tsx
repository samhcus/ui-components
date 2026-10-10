import { cn } from "@/lib/utils";

const LIGHT_BLUE = "#7EC8F2";

/**
 * Wordmark for Chopsticks Bot — rounded, friendly Nunito in light blue with a
 * small "BOT" badge, echoing the Discord-bot identity from the expanded face.
 */
export function ChopsticksWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-[0.35em] font-[family-name:var(--font-nunito)] font-extrabold leading-none tracking-tight",
        className
      )}
      aria-label="Chopsticks Bot"
    >
      <span style={{ color: LIGHT_BLUE }}>Chopsticks</span>
      <span
        className="rounded-[0.28em] font-bold text-white"
        style={{ background: LIGHT_BLUE, fontSize: "0.5em", padding: "0.15em 0.4em" }}
      >
        BOT
      </span>
    </span>
  );
}
