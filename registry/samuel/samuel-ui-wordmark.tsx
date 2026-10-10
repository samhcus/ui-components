import { cn } from "@/lib/utils";

// Single accent for the "UI" chip — the sandbox shovel blue, already part of the
// house brand palette, so this mark sits alongside the other wordmarks.
const UI_ACCENT = "#3B82F6";

/**
 * Wordmark for Samuel's UI Components — the identity of the free component library.
 *
 * One cohesive lockup in rounded, friendly Nunito (shared with the other brand
 * marks), built as a tonal three-step so it reads as a single logo: "Samuel's" in
 * full foreground, a small blue "UI" chip as the library's mark, then "Components"
 * dropped to muted-foreground. Everything is em-relative, so it looks right both
 * small (a ~20px bento panel title) and large (a ~44px page hero). The passed
 * `className` sets the font-size. Monochrome-friendly with one restrained accent;
 * works in light and dark mode.
 */
export function SamuelUIWordmark({
  className,
  showOwner = true,
}: {
  className?: string;
  /** Set false to drop the "Samuel's" owner name and show just "UI Components". */
  showOwner?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-[0.32em] font-[family-name:var(--font-nunito)] font-extrabold leading-none tracking-tight",
        className
      )}
      aria-label={showOwner ? "Samuel's UI Components" : "UI Components"}
    >
      {showOwner && <span className="text-foreground">Samuel&rsquo;s</span>}
      <span
        className="inline-flex items-center rounded-[0.32em] font-bold text-white"
        style={{
          background: UI_ACCENT,
          fontSize: "0.62em",
          padding: "0.16em 0.36em",
          letterSpacing: "0.01em",
        }}
      >
        UI
      </span>
      <span className="text-muted-foreground">Components</span>
    </span>
  );
}
