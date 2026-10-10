import { cn } from "@/lib/utils";

/**
 * ComponentsWordmark — a clean product lockup: a small tracked eyebrow over a
 * two-part name, with the first token carried in an accent color. Font-size
 * comes from `className`; colors inherit from the theme. Pass your own eyebrow,
 * accent, and rest tokens to relabel it.
 */
export function ComponentsWordmark({
  eyebrow = "Samuel's",
  accent = "UI",
  rest = "Components",
  className,
}: {
  eyebrow?: string;
  accent?: string;
  rest?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex select-none flex-col leading-none tracking-tight", className)}
      aria-label={`${eyebrow} ${accent} ${rest}`}
    >
      <span
        className="font-semibold uppercase text-muted-foreground/60"
        style={{ fontSize: "0.5em", letterSpacing: "0.14em" }}
      >
        {eyebrow}
      </span>
      <span className="mt-[0.35em] inline-flex items-baseline gap-[0.25em] font-semibold text-foreground">
        <span>{accent}</span>
        <span>{rest}</span>
      </span>
    </span>
  );
}

export default ComponentsWordmark;
