import { cn } from "@/lib/utils";

/**
 * "Design" wordmark — the word set in tight Inter, monochrome on purpose. This
 * section is about the making, not a mascot, so it stays plain where Writing is
 * handwritten and Just for fun is playful.
 *
 * The mark IS Inter, so it opts out of the site-wide font switcher: it draws on
 * --font-inter-locked (the untouched copy) and cancels the switcher's inherited
 * advance-width rescale.
 */
export function DesignWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block select-none font-semibold leading-none tracking-[-0.03em] text-foreground",
        "font-[family-name:var(--font-inter-locked)] [font-size-adjust:none]",
        className
      )}
      aria-label="Design"
    >
      Design
      {/* Thin prism bar: a rainbow gradient that holographically drifts through the
          spectrum. Content colour (like the ticket iridescence), not chrome. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.16em] left-0 h-[0.1em] w-full rounded-full [background-size:200%_100%] animate-[prism-shift_4s_linear_infinite] motion-reduce:animate-none"
        style={{ backgroundImage: "linear-gradient(90deg,#ff2d55,#ff9500,#ffcc00,#34c759,#00c7be,#0a84ff,#5e5ce6,#bf5af2,#ff2d55)" }}
      />
    </span>
  );
}
