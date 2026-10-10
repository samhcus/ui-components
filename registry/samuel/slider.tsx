"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as number)}
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex w-full touch-none items-center select-none py-1",
        className
      )}
    >
      <SliderPrimitive.Track className="relative h-4 w-full grow rounded-md bg-zinc-700">
        <SliderPrimitive.Indicator className="absolute h-full rounded-md bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="Slider value"
        className="block size-3 rounded-[5px] border-2 border-primary bg-white shadow transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
