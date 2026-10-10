"use client";

import { useState } from "react";
import { PillToggle } from "@/registry/samuel/pill-toggle";
import { WokLogo } from "@/registry/samuel/wok-logo";
import { CatMark } from "@/registry/samuel/cat-mark";
import { SamuelUIWordmark } from "@/registry/samuel/samuel-ui-wordmark";
import { DesignWordmark } from "@/registry/samuel/design-wordmark";
import { VideoPlayer } from "@/registry/samuel/video-player";
import { AnimatedThemeToggler } from "@/registry/samuel/animated-theme-toggler";
import { Cursor } from "@/registry/samuel/cursor";
import { QpDither } from "@/registry/samuel/qp-dither";
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogDescription,
  MorphingDialogImage,
} from "@/registry/samuel/morphing-dialog";
import { Globe3D } from "@/registry/samuel/globe-3d";
import { CanvasRevealEffect } from "@/registry/samuel/canvas-reveal-effect";
import { Button } from "@/registry/samuel/button";
import { Input } from "@/registry/samuel/input";
import { Slider } from "@/registry/samuel/slider";
import { TooltipProvider, Tip } from "@/registry/samuel/tooltip";
import { toast } from "sonner";
import { WebHapticsGrid } from "@/registry/samuel/web-haptics-demo";
import { IgGradientDefs } from "@/registry/samuel/ig-gradient";
import { AgentRosterFace } from "@/registry/samuel/agent-roster";
import { Accent, Colored, Fancy, Tip as ProseTip } from "@/registry/samuel/prose-kit";
import Typewriter from "@/registry/samuel/typewriter";
import { PulsatingButton } from "@/registry/samuel/pulsating-button";
import { MagneticButton } from "@/registry/samuel/magnetic-button";
import { ShipToggle } from "@/registry/samuel/ship-toggle";
import CSSBox from "@/registry/samuel/css-box";
import { DitherImage } from "@/registry/samuel/dither-image";
import { RageButton } from "@/registry/samuel/rage-button";
import { SocialButtons } from "@/registry/samuel/social-buttons";
import { WordmarkPanel, PIXEL_PALS_COLORS } from "@/registry/samuel/wordmark-panel";
import { SegmentedControl } from "@/registry/samuel/segmented-control";
import { AnimatedCounter } from "@/registry/samuel/animated-counter";
import { SpotlightCard } from "@/registry/samuel/spotlight-card";
import { ShimmerButton } from "@/registry/samuel/shimmer-button";
import { TiltCard } from "@/registry/samuel/tilt-card";
import { ConfettiButton } from "@/registry/samuel/confetti-button";
import { HueSlider } from "@/registry/samuel/hue-slider";
import { SnapBackCard } from "@/registry/samuel/snap-back-card";
import { WaveFill } from "@/registry/samuel/wave-fill";
import { BubbleField } from "@/registry/samuel/bubble-field";
import { Aurora } from "@/registry/samuel/aurora";
import { WeatherStack } from "@/registry/samuel/weather-stack";
import { WeatherScene } from "@/registry/samuel/weather-scene";
import { PurchaseButton } from "@/registry/samuel/purchase-button";
import { CoffeeButton } from "@/registry/samuel/coffee-button";
import { ReadMoreButton } from "@/registry/samuel/read-more-button";
import { BookCover } from "@/registry/samuel/book-cover";
import { SpinningGlobe } from "@/registry/samuel/spinning-globe";
import { SamuelWordmark } from "@/registry/samuel/samuel-wordmark";
import { WritingWordmark } from "@/registry/samuel/writing-wordmark";
import { ChopsticksWordmark } from "@/registry/samuel/chopsticks-wordmark";
import { SandboxWordmark } from "@/registry/samuel/sandbox-wordmark";
import { ComponentsWordmark } from "@/registry/samuel/components-wordmark";
import { JustForFunWordmark } from "@/registry/samuel/just-for-fun-wordmark";
import { PixelWordmark, PIXEL_COLORS } from "@/registry/samuel/pixel-wordmark";
import { Flags } from "@/registry/samuel/flags";
import { Reveal } from "@/registry/samuel/reveal";
import { FreeTag } from "@/registry/samuel/free-tag";
import { HandWrite } from "@/registry/samuel/hand-write";
import { PushButton } from "@/registry/samuel/push-button";
import { ExampleWindow } from "@/components/library/example-window";
import { Power } from "lucide-react";

function ConfettiButtonDemo() {
  return <ConfettiButton>Celebrate</ConfettiButton>;
}

function SliderDemo() {
  const [v, setV] = useState(50);
  return (
    <div className="w-56">
      <Slider value={v} onValueChange={setV} />
    </div>
  );
}


function ShipToggleDemo() {
  const [on, setOn] = useState(false);
  return <ShipToggle checked={on} onCheckedChange={setOn} />;
}

function PillToggleDemo() {
  // Controlled: an isolated demo switch so clicking it in the grid can never
  // flip the site's actual theme (the uncontrolled component drives next-themes).
  const [dark, setDark] = useState(false);
  return <PillToggle checked={dark} onCheckedChange={setDark} />;
}

function AnimatedThemeTogglerDemo() {
  // Controlled + mutateDocument={false}: flips only this local icon, never
  // document.documentElement or the page-wide View Transition wipe.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      mutateDocument={false}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground [&_svg]:h-5 [&_svg]:w-5"
    />
  );
}

function MemojiWidgetPreview() {
  // The real widget floats fixed to the viewport; this is a static teaser of it.
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="rounded-2xl rounded-br-md border border-border bg-background px-3.5 py-2 text-[12px] text-muted-foreground shadow-sm">
        Hey, tap to talk.
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-foreground/80 to-foreground/40 text-2xl font-semibold text-background shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        S
      </div>
    </div>
  );
}

function HueSliderDemo() {
  const [hue, setHue] = useState(210);
  return (
    <div className="flex w-56 flex-col items-center gap-3">
      <span
        className="h-12 w-12 rounded-2xl"
        style={{ background: `hsl(${hue} 90% 55%)`, boxShadow: `0 8px 24px hsl(${hue} 90% 55% / 0.45)` }}
      />
      <HueSlider value={hue} onChange={setHue} showSwatch={false} className="w-full" />
    </div>
  );
}

/** slug → live preview. Each renders the real shipped component. */
export const PREVIEWS: Record<string, () => React.ReactNode> = {
  "reading-gif-panel": () => (
    <div className="w-[390px] max-w-full min-w-0">
      <iframe title="Original Reading GIF Panel example" src="/examples/reading-gif-panel" loading="lazy" className="h-[340px] w-full border-0" />
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <a href="/examples/reading-gif-panel" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Open original panel ↗</a>
        <a href="/r/reading-gif-panel-example.zip" download className="underline underline-offset-4">Download original example ↓</a>
      </div>
    </div>
  ),
  "dynamic-toolbar": () => <ExampleWindow />,
  "pill-toggle": () => <PillToggleDemo />,
  // The full widget floats fixed to the viewport; at rest it's this memoji card.
  "samuel-widget": () => (
    <div className="h-24 w-24 overflow-hidden rounded-[26px] border-[3px] border-background bg-card shadow-[0_8px_32px_rgba(0,0,0,0.2),0_2px_8px_rgba(0,0,0,0.12)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/samuel-memoji.png" alt="Samuel" className="h-full w-full select-none object-cover object-top" draggable={false} />
    </div>
  ),
  typewriter: () => (
    <span className="text-lg font-medium tracking-tight text-foreground">
      built with{" "}
      <Typewriter
        text={["rage", "coffee", "spite", "love"]}
        as="span"
        speed={70}
        deleteSpeed={40}
        waitTime={1600}
        className="text-primary"
        cursorClassName="ml-0.5 text-primary"
      />
    </span>
  ),
  "pulsating-button": () => <PulsatingButton>Notify</PulsatingButton>,
  "magnetic-button": () => (
    <MagneticButton>
      <span className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
        Come here
      </span>
    </MagneticButton>
  ),
  "ship-toggle": () => <ShipToggleDemo />,
  "css-box": () => (
    <CSSBox
      width={104}
      height={104}
      depth={104}
      draggable
      faces={{
        front: (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-2xl">
            📦
          </div>
        ),
        back: (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-foreground/10 text-2xl">
            😤
          </div>
        ),
        left: (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-foreground/5 text-2xl">
            ☕
          </div>
        ),
        right: (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-foreground/5 text-2xl">
            🚀
          </div>
        ),
        top: (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-foreground/5 text-[11px] text-muted-foreground">
            drag me
          </div>
        ),
        bottom: (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-foreground/5 text-[11px] text-muted-foreground">
            ship it
          </div>
        ),
      }}
    />
  ),
  "dither-image": () => (
    <DitherImage
      src="/brand/samuel-memoji.png"
      width={150}
      height={150}
      pixelSize={3}
      className="rounded-lg border border-border"
      alt="Dithered portrait"
    />
  ),
  "rage-button": () => <RageButton>Ship it</RageButton>,
  "social-buttons": () => <SocialButtons />,
  "memoji-widget": () => <MemojiWidgetPreview />,
  "wordmark-panel": () => (
    <WordmarkPanel text="Pixel Pals" colors={PIXEL_PALS_COLORS} subtitle="my crew">
      <div
        aria-hidden
        className="h-full w-full"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(0,0,0,0.10), transparent 60%)" }}
      />
    </WordmarkPanel>
  ),
  "segmented-control": () => <SegmentedControl options={["Day", "Week", "Month"]} />,
  "animated-counter": () => <AnimatedCounter />,
  "spotlight-card": () => (
    <SpotlightCard
      eyebrow=""
      title="Spotlight Card"
      description="A surface that catches the light. Move your cursor across it and the border follows with a little weight."
      ctaLabel=""
    />
  ),
  "shimmer-button": () => <ShimmerButton showArrow={false}>Get started</ShimmerButton>,
  "tilt-card": () => (
    <TiltCard>
      <div className="flex h-28 w-44 items-center justify-center rounded-xl bg-card text-[13px] font-medium text-foreground">
        Tilt me
      </div>
    </TiltCard>
  ),
  "confetti-button": () => <ConfettiButtonDemo />,
  "hue-slider": () => <HueSliderDemo />,
  "snap-back-card": () => (
    <SnapBackCard>
      <div className="flex h-24 w-40 select-none items-center justify-center rounded-2xl border border-border bg-card text-[13px] font-medium text-foreground shadow-sm">
        Drag me anywhere
      </div>
    </SnapBackCard>
  ),
  "wave-fill": () => (
    <div className="relative h-32 w-44 overflow-hidden rounded-2xl border border-border bg-card">
      <WaveFill color="#38bdf8" level={0.6} />
    </div>
  ),
  "bubble-field": () => (
    <div className="relative h-32 w-44 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-sky-500/20 to-sky-500/5">
      <BubbleField color="#38bdf8" count={16} rise={140} />
    </div>
  ),
  aurora: () => (
    <div className="relative h-32 w-44 overflow-hidden rounded-2xl border border-border bg-neutral-950">
      <Aurora colors={["#7c6cff", "#22d3ee", "#f472b6"]} blur={28} />
    </div>
  ),
  "weather-stack": () => (
    <div className="flex w-64 justify-center rounded-2xl bg-neutral-900 p-4">
      <WeatherStack />
    </div>
  ),
  "weather-scene": () => (
    <div className="w-72">
      <WeatherScene />
    </div>
  ),
  "purchase-button": () => <PurchaseButton label="Purchase" />,
  "coffee-button": () => (
    <div className="rounded-xl bg-neutral-900 p-5">
      <CoffeeButton label="Buy me a coffee" href="#" />
    </div>
  ),
  "read-more-button": () => <ReadMoreButton label="Read more" href="#" />,
  "book-cover": () => (
    <BookCover
      cover="/reading/aisnakeoil.png"
      title="AI Snake Oil"
      author="Narayanan & Kapoor"
      about="Two Princeton researchers separate the AI that works from the AI that doesn't, with a clear-eyed account of what generative AI genuinely can and can't do."
      buyHref="https://www.amazon.com/s?k=AI+Snake+Oil"
      status="Currently reading"
      width={96}
    />
  ),
  "spinning-globe": () => <SpinningGlobe size={40} className="text-foreground" />,
  "samuel-wordmark": () => <SamuelWordmark className="text-5xl text-foreground" />,
  "writing-wordmark": () => <WritingWordmark className="text-5xl" />,
  "chopsticks-wordmark": () => <ChopsticksWordmark className="text-3xl" />,
  "sandbox-wordmark": () => <SandboxWordmark className="text-4xl" />,
  "components-wordmark": () => <ComponentsWordmark className="text-3xl" />,
  "just-for-fun-wordmark": () => <JustForFunWordmark className="text-3xl" />,
  "pixel-wordmark": () => (
    <PixelWordmark text="Pixel" colors={PIXEL_COLORS} className="text-2xl" />
  ),
  "flags": () => <Flags />,
  "reveal": () => (
    <Reveal>
      <div className="rounded-xl border border-border bg-card px-6 py-5 text-sm text-foreground">
        Fades up into view
      </div>
    </Reveal>
  ),
  "free-tag": () => (
    <div className="relative h-44 w-56">
      <FreeTag />
    </div>
  ),
  // Static preview: the live SiteCursor takes over the whole page cursor, so the
  // gallery shows its resting appearance instead. "View code" has the real source.
  "site-cursor": () => (
    <div className="relative flex h-28 w-full items-center justify-center">
      <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-[24px] bg-gray-500/40 px-3 py-1.5 backdrop-blur-md dark:bg-gray-300/40">
        <span className="h-2 w-2 rounded-full bg-white dark:bg-black" />
        <span className="text-sm text-white dark:text-black">More</span>
      </span>
    </div>
  ),
  "hand-write": () => (
    <div className="relative h-40 w-64 overflow-hidden rounded-xl bg-[#0b1220]">
      <HandWrite autoPlay autoErase={false} />
    </div>
  ),
  "push-button": () => (
    <PushButton aria-label="Power">
      <Power size={18} strokeWidth={2.5} />
    </PushButton>
  ),
  "wok-logo": () => <WokLogo size={48} className="text-foreground" />,
  "cat-mark": () => <CatMark className="h-12 w-auto text-foreground" />,
  "samuel-ui-wordmark": () => <SamuelUIWordmark className="text-2xl" />,
  "design-wordmark": () => <DesignWordmark className="text-4xl" />,
  "video-player": () => (
    <div className="w-full max-w-md">
      <VideoPlayer src="/video/site-intro.mp4" />
    </div>
  ),
  "animated-theme-toggler": () => <AnimatedThemeTogglerDemo />,
  "cursor": () => (
    <div className="relative flex h-40 w-full items-center justify-center rounded-xl border border-border bg-card">
      <span className="text-sm text-muted-foreground">Hover here</span>
      <Cursor
        attachToParent
        variants={{
          initial: { scale: 0.3, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.3, opacity: 0 },
        }}
        transition={{ ease: "easeInOut", duration: 0.15 }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-foreground px-2 py-1 text-xs font-medium text-background">
          you
        </span>
      </Cursor>
    </div>
  ),
  "morphing-dialog": () => (
    <MorphingDialog transition={{ type: "spring", bounce: 0.05, duration: 0.25 }}>
      <MorphingDialogTrigger className="flex w-56 flex-col overflow-hidden rounded-xl border border-border bg-card text-left">
        <MorphingDialogImage
          src="/brand/samuel-memoji.png"
          alt="Samuel"
          className="h-28 w-full object-cover object-top"
        />
        <div className="p-3">
          <MorphingDialogTitle className="text-sm font-medium text-foreground">
            Morphing Dialog
          </MorphingDialogTitle>
          <MorphingDialogSubtitle className="text-xs text-muted-foreground">
            Click to expand
          </MorphingDialogSubtitle>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative flex w-80 flex-col rounded-2xl border border-border bg-card">
          <MorphingDialogImage
            src="/brand/samuel-memoji.png"
            alt="Samuel"
            className="h-52 w-full object-cover object-top"
          />
          <div className="p-5">
            <MorphingDialogTitle className="text-lg font-medium text-foreground">
              Morphing Dialog
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className="text-sm text-muted-foreground">
              Shared layout morph
            </MorphingDialogSubtitle>
            <MorphingDialogDescription className="mt-2 text-sm text-muted-foreground">
              The trigger and this panel share a layoutId, so one grows out of the other.
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose className="text-foreground" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  ),
  "background-effects": () => (
    <div className="relative h-40 w-56 overflow-hidden rounded-xl bg-[#0b1220]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 65% at 24% 24%, rgba(160,130,255,0.85), transparent 60%), radial-gradient(58% 62% at 82% 76%, rgba(80,200,255,0.7), transparent 58%), radial-gradient(52% 56% at 56% 46%, rgba(110,255,190,0.5), transparent 58%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  ),
  "qp-dither": () => (
    <div className="flex h-40 w-40 items-center justify-center text-foreground">
      <QpDither />
    </div>
  ),
  "cat-cursor": () => (
    <div className="relative flex h-28 w-full items-center justify-center">
      <span
        aria-hidden
        className="block"
        style={{
          width: 32,
          height: 32,
          backgroundImage: "url(/oneko.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "-96px -96px",
          imageRendering: "pixelated",
        }}
      />
    </div>
  ),
  "globe-3d": () => (
    <div className="h-40 w-56 overflow-hidden">
      <Globe3D
        className="!h-40 !w-full"
        markers={[
          { lat: 47.6062, lng: -122.3321, src: "" },
          { lat: 51.5074, lng: -0.1278, src: "" },
        ]}
      />
    </div>
  ),
  "canvas-reveal-effect": () => (
    <div className="h-40 w-56 overflow-hidden rounded-md bg-black">
      <CanvasRevealEffect
        animationSpeed={3}
        colors={[
          [59, 130, 246],
          [139, 92, 246],
        ]}
        dotSize={3}
        containerClassName="bg-transparent"
      />
    </div>
  ),
  "button": () => (
    <div className="flex items-center gap-2">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
  "input": () => <Input placeholder="Email" className="w-56" />,
  "slider": () => <SliderDemo />,
  "tooltip": () => (
    <TooltipProvider>
      <Tip label="Tooltip">
        <button className="w-24 rounded-[9px] border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground">
          Hover me
        </button>
      </Tip>
    </TooltipProvider>
  ),
  "toaster": () => (
    <button
      onClick={() => toast("Hello")}
      className="w-24 rounded-[9px] border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground"
    >
      Toast
    </button>
  ),
  "web-haptics-demo": () => (
    <div className="w-64">
      <WebHapticsGrid />
    </div>
  ),
  "agent-roster": () => (
    <div className="h-40 w-64 overflow-hidden rounded-lg border border-border">
      <AgentRosterFace />
    </div>
  ),
  "prose-kit": () => (
    <TooltipProvider>
      <p className="w-64 text-[15px] leading-relaxed text-foreground">
        Every <Fancy>little</Fancy> detail is a{" "}
        <Colored color="#2563EB">choice</Colored>, and the <Accent>best</Accent> ones{" "}
        <ProseTip tip="A word with a hover note">reward a closer look</ProseTip>.
      </p>
    </TooltipProvider>
  ),
  "ig-gradient": () => (
    <div className="flex w-64 items-center justify-center">
      <IgGradientDefs />
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
        <rect x="0" y="0" width="80" height="80" rx="20" fill="url(#ig-gradient)" />
      </svg>
    </div>
  ),
};
