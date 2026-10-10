"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 400,
  closeDelay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  // Initial delay guards against accidental activation; Base UI then grants
  // subsequent tooltips in the group `data-instant` (zero delay, zero animation),
  // so sweeping across a cluster of controls opens each one instantly. Emil #3.
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  showArrow = false,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & { showArrow?: boolean }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={8}
        // Above everything, including the draw-mode dynamic island (z-95010) and
        // the full-page draw canvas (z-95000). A tooltip is always topmost.
        className="isolate z-[100000]"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            // Compact dark pill — the one canonical tooltip look site-wide.
            // (`bg-foreground text-background`, per the design doctrine.)
            "w-fit max-w-xs origin-(--transform-origin) rounded-[9px] bg-foreground px-2.5 py-1.5 text-[11px] font-medium leading-snug text-background shadow-[0_8px_24px_rgba(0,0,0,0.22)]",
            // Origin-aware (scales from its trigger, Emil #5), rests at scale(0.94)
            // rather than 0 (Emil #2), house ease-out, <300ms (Emil #4/#6).
            "transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "data-[starting-style]:scale-[0.94] data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-[0.94] data-[ending-style]:opacity-0",
            // Group-skip: an already-primed sibling opens with no delay + no motion.
            "data-[instant]:duration-0",
            className
          )}
          {...props}
        >
          {children}
          {showArrow ? (
            <TooltipPrimitive.Arrow className="size-2 translate-y-[calc(-50%-1px)] rotate-45 rounded-[2px] bg-foreground data-[side=bottom]:top-1 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2" />
          ) : null}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

/**
 * The one-liner tooltip used everywhere in site chrome. Wraps an existing
 * interactive element (button, slider, the theme toggler) in a portalled Base UI
 * tooltip so the label NEVER clips against an `overflow-hidden` ancestor (the
 * dynamic island, prose columns, cards). Pass `inline` for an in-flow word.
 *
 *   <Tip label="Theme"><button …/></Tip>
 *   <Tip label="A gothic typeface" inline>blackletter</Tip>
 */
function Tip({
  label,
  children,
  side = "top",
  sideOffset,
  align = "center",
  className,
  contentClassName,
  inline = false,
  showArrow = false,
  disabled = false,
}: {
  label: React.ReactNode
  children: React.ReactNode
  side?: TooltipPrimitive.Positioner.Props["side"]
  sideOffset?: number
  align?: TooltipPrimitive.Positioner.Props["align"]
  /** classes for the trigger wrapper (layout: width, margins, cursor, underline). */
  className?: string
  /** classes for the floating pill (rare: rich content that opts out of the pill). */
  contentClassName?: string
  inline?: boolean
  showArrow?: boolean
  disabled?: boolean
}) {
  if (disabled || label == null || label === "") return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className={cn(inline ? "inline" : "flex", className)}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        align={align}
        showArrow={showArrow}
        className={contentClassName}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Tip }
