import { cn } from "@/lib/utils";

// Primary toy palette from the sandbox graphic: bucket red, sand amber, shovel blue.
const SANDBOX_LETTERS = [
  { ch: "S", color: "#EF4444" },
  { ch: "a", color: "#F59E0B" },
  { ch: "n", color: "#3B82F6" },
  { ch: "d", color: "#EF4444" },
  { ch: "b", color: "#F59E0B" },
  { ch: "o", color: "#3B82F6" },
  { ch: "x", color: "#EF4444" },
];

/**
 * Chunky, rounded, beach-toy wordmark for "Sandbox" — deliberately distinct from
 * the blocky pixel Pixel Pals mark: soft rounded Nunito, primary toy colors, a
 * gentle alternating tilt and a drop shadow so the letters read as glossy toys.
 */
export function SandboxWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-end select-none font-[family-name:var(--font-nunito)] font-extrabold leading-none",
        className
      )}
      aria-label="Sandbox"
    >
      {SANDBOX_LETTERS.map((l, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            color: l.color,
            transform: `rotate(${i % 2 === 0 ? -4 : 4}deg)`,
            textShadow: "0 2px 0 rgba(0,0,0,0.18)",
          }}
        >
          {l.ch}
        </span>
      ))}
    </span>
  );
}
