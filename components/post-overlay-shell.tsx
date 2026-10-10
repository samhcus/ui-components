import { CaretLeft, House, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Layout for a full-page post overlay: a single centered content column. The
 * Back/Close control is NOT in here — it lives as a fixed, top-centred pill (see
 * OverlayControl) so the content sits dead-centre on the page instead of being
 * pushed right by a side rail.
 */
export function PostOverlayShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>
      {children}
    </div>
  );
}

/**
 * The Back/Close control for a post overlay: a rounded-rect pill (squircle, not a
 * stadium) pinned to the top-centre of the viewport that stays put while the post
 * scrolls, and rests dimmed until hovered. Render it as a direct child of the
 * overlay's outer (untransformed) container so `fixed` anchors to the viewport.
 */
export function OverlayControl({
  variant,
  onClick,
}: {
  variant: "back" | "close" | "home";
  onClick: () => void;
}) {
  const label = variant === "back" ? "Back" : variant === "home" ? "Home" : "Close";
  const Icon = variant === "back" ? CaretLeft : variant === "home" ? House : X;
  // per-variant hover nudge: back slides left, home lifts, close spins the X
  const iconMotion =
    variant === "back"
      ? "group-hover:-translate-x-0.5"
      : variant === "home"
        ? "group-hover:-translate-y-0.5"
        : "group-hover:rotate-90";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[250] flex justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={variant === "home" ? "Return to the home page" : label}
        className="group pointer-events-auto inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-card/90 py-1.5 pl-2.5 pr-3 text-[13px] font-medium text-muted-foreground opacity-60 shadow-sm backdrop-blur transition-[color,background-color,opacity,transform] duration-200 ease-[var(--ease-out)] hover:bg-muted/70 hover:text-foreground hover:opacity-100 active:scale-[0.97] [@media(hover:none)]:opacity-90"
      >
        <Icon size={15} weight="bold" className={cn("transition-transform duration-200 ease-[var(--ease-out)]", iconMotion)} />
        {label}
      </button>
    </div>
  );
}
