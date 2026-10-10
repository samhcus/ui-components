import { cn } from "@/lib/utils";

/**
 * Wordmark for Samuel's UI Components — a clean product lockup:
 * "SAMUEL'S" as a small tracked eyebrow, then "UI Components" as the anchor
 * with "UI" carried in the violet registry accent.
 */
export function ComponentsWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex select-none flex-col leading-none tracking-tight", className)}
      aria-label="Samuel's UI Components"
    >
      <span
        className="font-semibold uppercase text-muted-foreground/60"
        style={{ fontSize: "0.5em", letterSpacing: "0.14em" }}
      >
        Samuel&apos;s
      </span>
      <span className="mt-[0.35em] inline-flex items-baseline gap-[0.25em] font-semibold text-foreground">
        <span>UI</span>
        <span>Components</span>
      </span>
    </span>
  );
}
