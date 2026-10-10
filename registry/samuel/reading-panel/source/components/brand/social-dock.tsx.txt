"use client";

import { GithubLogo, InstagramLogo, YoutubeLogo, LinkedinLogo, Coffee } from "@phosphor-icons/react";
import { samuelSocials } from "@/lib/socials";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * Frosted social links over the reading gif. Each chip carries a clean 2px brand-coloured
 * border AT REST (Instagram gradient ring, YouTube red, LinkedIn blue, GitHub white,
 * coffee yellow) over frosted glass — colour on the border only, no glow; on hover it
 * escalates into the full brand fill — see the `.rs-*` rules in globals.css. A press-scale
 * gives tactile feedback.
 *
 * The CTA label is the shared Base UI Tooltip (`@/components/ui/tooltip`), but with
 * `duration-0` so it appears INSTANTLY — no scale/fade popup. The group skip-delay
 * (initial delay on the first, then instant across siblings — Emil #3) still comes
 * from the global TooltipProvider; only the enter/exit motion is zeroed. The tooltip
 * portals to the body, so it clears the gif's overflow-hidden clip.
 *
 * Placement: a vertical column pinned to the right edge, centred, on both canvases.
 * Stacking them keeps the chips clear of the Currently-reading books at bottom-left
 * on the narrow 390px mobile canvas (a horizontal band would overlap the pile).
 *
 * v4 note: `scale` is its own CSS property in Tailwind v4, so the transition lists
 * it explicitly — `transition-[…,transform]` would not animate the press-scale.
 */
const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]"; // house --ease-out

type Item = { key: string; href: string; glyph: React.ReactNode; cta: string; brand: string };

const COFFEE: Item = {
  key: "Coffee",
  href: "https://buymeacoffee.com/samhcus",
  glyph: <Coffee size={18} weight="fill" />,
  cta: "Buy me a coffee",
  brand: "rs-coffee",
};

const SOCIAL_META: Record<string, { glyph: React.ReactNode; cta: string; brand: string }> = {
  Instagram: { glyph: <InstagramLogo size={18} weight="fill" />, cta: "Follow me on Instagram", brand: "rs-instagram" },
  YouTube: { glyph: <YoutubeLogo size={19} weight="fill" />, cta: "Subscribe on YouTube", brand: "rs-youtube" },
  GitHub: { glyph: <GithubLogo size={18} weight="fill" />, cta: "Follow me on GitHub", brand: "rs-github" },
  LinkedIn: { glyph: <LinkedinLogo size={18} weight="fill" />, cta: "Connect on LinkedIn", brand: "rs-linkedin" },
};

// Instagram, then these socials, then coffee last (X is intentionally omitted).
const SOCIAL_ORDER = ["Instagram", "YouTube", "GitHub", "LinkedIn"] as const;

export function SocialDock() {
  const socials: Item[] = SOCIAL_ORDER.flatMap((label) => {
    const s = samuelSocials.find((x) => x.label === label);
    const meta = SOCIAL_META[label];
    return s && meta ? [{ key: label, href: s.href, glyph: meta.glyph, cta: meta.cta, brand: meta.brand }] : [];
  });
  const items: Item[] = [...socials, COFFEE];

  return (
    <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 pr-4 md:pr-5">
      {items.map((it) => (
        <Tooltip key={it.key}>
          <TooltipTrigger
            render={<a href={it.href} target="_blank" rel="noopener noreferrer" />}
            aria-label={it.cta}
            className="group/social relative block h-9 w-9 shrink-0"
          >
            <span
              className={`rs-chip grid h-9 w-9 place-items-center rounded-[13px] bg-white/10 text-white/85 backdrop-blur-md transition-[background,border-color,box-shadow,color,scale] duration-200 ${EASE} group-active/social:scale-95 ${it.brand}`}
            >
              {it.glyph}
            </span>
          </TooltipTrigger>
          {/* duration-0 → appears instantly, no scale/fade popup */}
          <TooltipContent side="top" className="duration-0">
            {it.cta}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
