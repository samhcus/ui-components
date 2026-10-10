"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  X,
  MapPin,
  Copy,
  Check,
  GithubLogo,
  XLogo,
  InstagramLogo,
  YoutubeLogo,
  EnvelopeSimple,
  GlobeHemisphereWest,
  Play,
} from "@phosphor-icons/react";
import { Globe3D } from "@/components/ui/3d-globe";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Exclusive-panel coordinator (inlined, dependency-free).
// The host page may have several floating panels; only one should be open at a
// time. A panel announces itself on open, and every other panel closes.
// ---------------------------------------------------------------------------
type PanelListener = (owner: string) => void;
const panelListeners = new Set<PanelListener>();
function openExclusivePanel(owner: string): void {
  for (const l of panelListeners) l(owner);
}
function onExclusivePanel(cb: PanelListener): () => void {
  panelListeners.add(cb);
  return () => panelListeners.delete(cb);
}

// Warm-but-crisp ease-out for content; drawer curve for the shell expand.
const ease = [0.23, 1, 0.32, 1] as const;
const expand = [0.32, 0.72, 0, 1] as const;
const SEEN_KEY = "memoji-welcome-seen";
const AVATAR = 96;
const PAD = 16;
const MEMOJI_LAYOUT_ID = "memoji-avatar";

type Preview =
  | "closed"
  | "globe"
  | "video"
  | "github"
  | "twitter"
  | "instagram"
  | "youtube"
  | "email"
  | "discord";

type RowButton = { id: Preview; label: string; brand?: string; icon: React.JSX.Element };

// Profile previews — a real outbound link lives inside each as the CTA.
type ProfilePreview = {
  title: string;
  handle: string;
  blurb: string;
  href: string;
  cta: string;
  accent: string;
  icon: React.JSX.Element;
};

function DiscordIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 -28.5 256 256" fill="currentColor" aria-hidden>
      <path d="M216.856 16.597C200.285 8.843 182.566 3.208 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.845-14.046C73.353 3.208 55.613 8.864 39.042 16.638 5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193 5.215-7.177 9.866-14.807 13.873-22.848-7.631-2.9-14.94-6.478-21.846-10.632 1.832-1.357 3.624-2.776 5.356-4.236 42.122 19.702 87.89 19.702 129.51 0 1.752 1.46 3.543 2.879 5.356 4.236-6.926 4.175-14.255 7.753-21.886 10.653 4.007 8.02 8.638 15.67 13.873 22.847 21.142-6.581 42.646-16.637 64.815-33.213 5.316-56.288-9.081-105.09-38.056-148.36zM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18 0-14.376 10.17-26.2 23.015-26.2 12.845 0 23.415 11.819 23.215 26.2.02 14.375-10.37 26.18-23.215 26.18zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18 0-14.376 10.17-26.2 23.014-26.2 12.845 0 23.415 11.819 23.215 26.2 0 14.375-10.37 26.18-23.215 26.18z" />
    </svg>
  );
}

// Renders the avatar image if a src is provided, otherwise a neutral gradient
// tile with the first initial — so the widget never 404s without an image.
function AvatarMedia({
  src,
  name,
  sizes,
  fontSize,
}: {
  src?: string;
  name: string;
  sizes: string;
  fontSize: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        fill
        sizes={sizes}
        className="object-cover object-top pointer-events-none"
        draggable={false}
        priority
      />
    );
  }
  return (
    <span
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-400 to-indigo-600 font-semibold text-white select-none"
      style={{ fontSize }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "A"}
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-[3px] h-[18px] px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[6px] h-[6px] rounded-[3px] bg-current opacity-60"
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function LocalTime({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
    let interval: ReturnType<typeof setInterval>;
    const id = requestAnimationFrame(() => {
      setTime(fmt.format(new Date()));
      interval = setInterval(() => setTime(fmt.format(new Date())), 30_000);
    });
    return () => {
      cancelAnimationFrame(id);
      clearInterval(interval);
    };
  }, [timeZone]);

  if (!time) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className="text-[10px] text-muted-foreground/60 tabular-nums cursor-default"
      >
        {time}
      </TooltipTrigger>
      <TooltipContent side="top">My local time right now</TooltipContent>
    </Tooltip>
  );
}

function IntroBubbles({ bubbles }: { bubbles: string[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= bubbles.length) return;
    const t = setTimeout(
      () => setStep((s) => s + 1),
      step === 0 ? 0 : 1100,
    );
    return () => clearTimeout(t);
  }, [step, bubbles.length]);

  return (
    <>
      <AnimatePresence mode="popLayout">
        {bubbles.slice(0, step).map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease }}
            className={`bg-primary text-primary-foreground px-4 py-2.5 text-[13.5px] leading-snug font-[450] shadow-[0_4px_20px_rgba(0,0,0,0.22)] ${
              i === bubbles.length - 1
                ? "rounded-[20px] rounded-br-[6px]"
                : "rounded-[20px]"
            }`}
          >
            {text}
          </motion.div>
        ))}
      </AnimatePresence>
      {step < bubbles.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-primary text-primary-foreground px-4 py-3 rounded-[20px] rounded-br-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.22)]"
        >
          <TypingDots />
        </motion.div>
      )}
    </>
  );
}

function useSnapToEdge() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      x.set(window.innerWidth - AVATAR - PAD);
      y.set(window.innerHeight - AVATAR - PAD);
      setInitialized(true);
    });
    return () => cancelAnimationFrame(id);
  }, [x, y]);

  // Pinned bottom-right: re-anchor exactly to the corner on any viewport change.
  useEffect(() => {
    const onResize = () => {
      x.set(window.innerWidth - AVATAR - PAD);
      y.set(window.innerHeight - AVATAR - PAD);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [x, y]);

  return { x, y, initialized };
}

// Row buttons — equal-width, brand accent on hover.
const SOCIAL_BTN =
  "social-link flex flex-1 items-center justify-center h-11 rounded-xl text-muted-foreground/70 active:scale-[0.95] transition-[color,background-color,transform] duration-150";
// Neutral (email / globe / intro) — no brand color, just resolve to foreground on hover.
const SOCIAL_BTN_NEUTRAL = `${SOCIAL_BTN} [@media(hover:hover)]:hover:text-foreground`;
// Applied while a reveal button's panel is open.
const SOCIAL_BTN_ACTIVE = "!text-foreground bg-foreground/[0.06]";

// A social profile, previewed in-widget. The CTA is the real outbound link.
function ProfilePanel({ data }: { data: ProfilePreview }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border/50">
      <div
        className="p-4"
        style={{ background: `color-mix(in srgb, ${data.accent} 7%, transparent)` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
            style={{
              background: `color-mix(in srgb, ${data.accent} 16%, transparent)`,
              color: data.accent,
            }}
          >
            {data.icon}
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold leading-tight text-foreground">
              {data.title}
            </div>
            <div className="text-[12px] text-muted-foreground">{data.handle}</div>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {data.blurb}
        </p>
        <a
          href={data.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 inline-flex h-9 items-center rounded-[12px] bg-foreground px-3.5 text-[12.5px] font-medium text-background transition-[transform,opacity] duration-150 active:scale-[0.97] [@media(hover:hover)]:hover:opacity-90"
        >
          {data.cta}
        </a>
      </div>
    </div>
  );
}

// Compose an email right in the widget; Send hands off to the user's mail app.
function EmailPanel({
  email,
  value,
  onChange,
  onSend,
  onCopy,
  copied,
}: {
  email: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-border/50 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-primary/10 text-primary">
          <EnvelopeSimple size={20} weight="fill" />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-tight text-foreground">
            Email me
          </div>
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy email address"
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors [@media(hover:hover)]:hover:text-foreground"
          >
            {email}
            {copied ? (
              <Check size={11} weight="bold" className="text-emerald-500" />
            ) : (
              <Copy size={11} />
            )}
          </button>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="mt-3"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Write a message…"
          aria-label="Message"
          className="w-full resize-none rounded-[14px] border border-border bg-transparent px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/40 focus:border-foreground/30"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60">Opens your mail app</span>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-[12px] bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.97]"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export type MemojiWidgetProps = {
  /** Display name in the header, intro bubbles, and alt text. */
  name?: string;
  /** Avatar image src. Omit to render a neutral gradient tile with the initial. */
  avatarSrc?: string;
  /** Location label shown in the header and on the globe. */
  location?: string;
  /** IANA time zone for the live local-time readout. */
  timeZone?: string;
  /** Globe marker coordinates. */
  lat?: number;
  lng?: number;
  /** Contact email for the email tab + composer. */
  email?: string;
  /** Intro video src for the "Watch intro" tab. */
  videoSrc?: string;
};

export function MemojiWidget({
  name = "Ada",
  avatarSrc,
  location = "San Francisco",
  timeZone = "America/Los_Angeles",
  lat = 37.7749,
  lng = -122.4194,
  email = "hello@example.com",
  videoSrc = "/video/intro.mp4",
}: MemojiWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [preview, setPreview] = useState<Preview>("closed");
  const [emailMsg, setEmailMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { x, y, initialized } = useSnapToEdge();

  const introBubbles = [`Hey, I'm ${name}.`, `I make things. Tap to meet me.`];

  // Generic sample social profiles — swap for your own.
  const profile: Record<string, ProfilePreview> = {
    github: { title: "GitHub", handle: "@yourname", blurb: "Everything I build, out in the open.", href: "https://github.com", cta: "View profile", accent: "#9CA3AF", icon: <GithubLogo size={20} weight="fill" /> },
    twitter: { title: "X", handle: "@yourname", blurb: "Build logs and half-thoughts, in real time.", href: "https://x.com", cta: "Follow", accent: "#9CA3AF", icon: <XLogo size={18} weight="fill" /> },
    instagram: { title: "Instagram", handle: "@yourname", blurb: "Life in the margins between commits.", href: "https://instagram.com", cta: "Follow", accent: "#D62976", icon: <InstagramLogo size={20} weight="fill" /> },
    youtube: { title: "YouTube", handle: "@yourname", blurb: "Longer takes, when they're worth it.", href: "https://youtube.com", cta: "Subscribe", accent: "#FF0033", icon: <YoutubeLogo size={20} weight="fill" /> },
    discord: { title: "Discord", handle: "My server", blurb: "Come build with us. Quiet, kind, open.", href: "https://discord.com", cta: "Join server", accent: "#5865F2", icon: <DiscordIcon size={18} /> },
  };

  // The reveal row. Every button opens its preview below — none navigate away.
  const row: RowButton[] = [
    { id: "github", label: "GitHub", brand: "social-github", icon: <GithubLogo size={17} weight="fill" /> },
    { id: "twitter", label: "X", brand: "social-x", icon: <XLogo size={17} weight="fill" /> },
    { id: "instagram", label: "Instagram", brand: "social-instagram", icon: <InstagramLogo size={17} weight="fill" /> },
    { id: "youtube", label: "YouTube", brand: "social-youtube", icon: <YoutubeLogo size={17} weight="fill" /> },
    { id: "email", label: "Email", icon: <EnvelopeSimple size={17} weight="fill" /> },
    { id: "discord", label: "Discord", brand: "social-discord", icon: <DiscordIcon size={17} /> },
    { id: "globe", label: "Where I am", icon: <GlobeHemisphereWest size={17} weight="fill" /> },
    { id: "video", label: "Watch intro", icon: <Play size={17} weight="fill" /> },
  ];

  const globeMarkers = [{ lat, lng, src: "", label: location }];

  // Only one element may hold the shared layoutId at a time, or the morph won't
  // reconcile. Disabled under reduced-motion (plain fade instead).
  const morphId = reduce ? undefined : MEMOJI_LAYOUT_ID;

  // Intro bubbles sit above the avatar button, on whichever side it's snapped to.
  const bubbleX = useTransform(x, (v) =>
    typeof window === "undefined" || v + AVATAR / 2 < window.innerWidth / 2
      ? v
      : v + AVATAR - 230,
  );
  const bubbleY = useTransform(y, (v) => v - 10);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setSeen(localStorage.getItem(SEEN_KEY) === "1"),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (seen || reduce) return;
    const t = setTimeout(() => setBubbleVisible(true), 1500);
    return () => clearTimeout(t);
  }, [seen, reduce]);

  // Close and return focus to the floating avatar (the invoking control).
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => avatarRef.current?.focus());
  }, []);

  // Esc closes; move focus into the panel on open; Tab stays trapped inside it
  // (the card is aria-modal, so background content must be unreachable).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const focusable = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !cardRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const focusId = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(focusId);
    };
  }, [open, close]);

  // Reset the media slot when the panel closes so reopening starts on the globe.
  useEffect(() => {
    if (open) return;
    videoRef.current?.pause();
    setPreview("closed");
    setVideoStarted(false);
  }, [open]);

  // Only one floating panel open at a time. Announce on open; close when the
  // nav menu (or any other panel) opens.
  useEffect(() => {
    if (open) openExclusivePanel("widget");
  }, [open]);

  useEffect(
    () =>
      onExclusivePanel((owner) => {
        // Another panel opened — collapse quietly (don't grab focus back).
        if (owner !== "widget") setOpen(false);
      }),
    [],
  );

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        setBubbleVisible(false);
        localStorage.setItem(SEEN_KEY, "1");
        setSeen(true);
      }
      return nextOpen;
    });
  }, []);

  const showPreview = useCallback((next: Preview) => {
    if (next !== "video" && videoRef.current) {
      videoRef.current.pause();
      setVideoStarted(false);
    }
    setPreview(next);
  }, []);

  const togglePreview = useCallback(
    (id: Preview) => showPreview(preview === id ? "closed" : id),
    [preview, showPreview],
  );

  const sendEmail = useCallback(() => {
    const body = emailMsg.trim();
    window.location.href = `mailto:${email}${
      body ? `?body=${encodeURIComponent(body)}` : ""
    }`;
  }, [emailMsg, email]);

  const copyEmail = useCallback(() => {
    navigator.clipboard?.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [email]);

  const handleVideoPlay = useCallback(() => {
    setVideoStarted(true);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  }, []);

  return (
    <>
      {/* Intro bubbles — above the avatar, hidden once panel opens */}
      <AnimatePresence>
        {bubbleVisible && !open && initialized && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease }}
            style={{ x: bubbleX, y: bubbleY, width: 230 }}
            className="fixed top-0 left-0 z-50 cursor-pointer select-none"
            onClick={handleToggle}
          >
            <div className="absolute bottom-0 right-0 flex flex-col items-end gap-1.5 w-[230px]">
              <IntroBubbles bubbles={introBubbles} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrim + card — a focused "meet me" moment. The scrim is the dismissal surface. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              onClick={close}
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
              aria-hidden
            />

            <motion.div
              key="card"
              ref={cardRef}
              className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto w-auto sm:w-[380px] max-h-[calc(100dvh-2rem)] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label={`Meet ${name}`}
            >
              {/* Surface — bg/border/shadow fade+scale in behind the morphing memoji,
                  so the shared-element photo stays fully opaque while it travels. */}
              <motion.div
                aria-hidden
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                transition={{ duration: 0.3, ease: expand }}
                style={{ transformOrigin: "bottom right" }}
                className="pointer-events-none absolute inset-0 rounded-[28px] border border-border/60 bg-background/98 shadow-[0_32px_90px_rgba(0,0,0,0.28)]"
              />

              {/* Header — the memoji morphs in here; kept outside the fading layer so it stays crisp */}
              <div className="relative flex items-center gap-3 px-4 pt-5 pb-4 shrink-0">
                <motion.span
                  layoutId={morphId}
                  className="relative w-14 h-14 rounded-[18px] overflow-hidden shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
                  style={{ borderRadius: 18 }}
                >
                  <AvatarMedia src={avatarSrc} name={name} sizes="56px" fontSize={22} />
                </motion.span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-foreground leading-tight">
                    {name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span>{location}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <LocalTime timeZone={timeZone} />
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  onClick={close}
                  className="ml-auto flex items-center justify-center w-7 h-7 rounded-[10px] bg-foreground/[0.06] text-muted-foreground transition-[background-color,transform] duration-150 active:scale-[0.92] [@media(hover:hover)]:hover:bg-foreground/[0.11] [@media(hover:hover)]:hover:text-foreground"
                  aria-label="Close"
                >
                  <X weight="bold" size={12} />
                </button>
              </div>

              {/* Body — the reveal row and its preview; fades in after the shell settles */}
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.26, ease, delay: reduce ? 0 : 0.06 }}
                className="relative flex flex-col min-h-0 flex-1 pb-4"
              >
              {/* Reveal row — every button opens a preview below; none navigate away */}
              <div className="px-4 shrink-0">
                <div className="flex items-center gap-1">
                  {row.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => togglePreview(b.id)}
                      aria-label={b.label}
                      aria-expanded={preview === b.id}
                      aria-controls="memoji-preview-panel"
                      className={cn(
                        b.brand ? cn(SOCIAL_BTN, b.brand) : SOCIAL_BTN_NEUTRAL,
                        preview === b.id && SOCIAL_BTN_ACTIVE,
                      )}
                    >
                      {b.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview — globe, intro, a profile card, or the email composer */}
              <AnimatePresence initial={false}>
                {preview !== "closed" && (
                  <motion.div
                    key="preview"
                    id="memoji-preview-panel"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: expand }}
                    className="px-4 overflow-hidden shrink-0"
                  >
                    <div className="mt-3">
                      {preview === "globe" && (
                        <div className="relative h-[210px] w-full overflow-hidden rounded-[20px] border border-border/50 bg-zinc-950/[0.02]">
                          <Globe3D
                            className="h-full w-full"
                            markers={globeMarkers}
                            config={{
                              autoRotateSpeed: reduce ? 0 : 0.15,
                              showAtmosphere: true,
                              atmosphereColor: "#E5E7EB",
                              atmosphereIntensity: 0.15,
                              atmosphereBlur: 2,
                              enableZoom: true,
                              minDistance: 3.5,
                              maxDistance: 12,
                              radius: 2,
                              ambientIntensity: 0.8,
                              pointLightIntensity: 2.0,
                            }}
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-3 py-2">
                            <MapPin weight="fill" size={11} className="text-[#FF3B30]" />
                            <span className="text-[11px] font-medium text-white/80">{location}</span>
                          </div>
                        </div>
                      )}

                      {preview === "video" && (
                        <div className="relative h-[210px] w-full overflow-hidden rounded-[20px] border border-border/50 bg-zinc-950">
                          <video
                            ref={videoRef}
                            src={videoSrc}
                            className="h-full w-full object-cover"
                            playsInline
                            preload="metadata"
                            controls={videoStarted}
                            onEnded={() => setVideoStarted(false)}
                          />
                          {!videoStarted && (
                            <button
                              onClick={handleVideoPlay}
                              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/70 via-black/30 to-black/50"
                              aria-label="Play intro"
                            >
                              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/25 bg-white/15 backdrop-blur-sm transition-transform active:scale-[0.97]">
                                <Play size={18} weight="fill" className="ml-0.5 text-white" />
                              </span>
                              <span className="mt-2 text-[10px] font-medium tracking-wide text-white/60">Watch intro</span>
                            </button>
                          )}
                        </div>
                      )}

                      {profile[preview] ? <ProfilePanel data={profile[preview]!} /> : null}

                      {preview === "email" && (
                        <EmailPanel
                          email={email}
                          value={emailMsg}
                          onChange={setEmailMsg}
                          onSend={sendEmail}
                          onCopy={copyEmail}
                          copied={copied}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating avatar — draggable anchor. Hidden (and morphed into the card) while open. */}
      {initialized && (
        <motion.button
          ref={avatarRef}
          style={{ x, y, position: "fixed", top: 0, left: 0, zIndex: 51 }}
          animate={{
            opacity: open ? 0 : 1,
            scale: open ? 0.9 : 1,
            ...(!seen && !reduce && !open
              ? { rotate: [0, -4, 4, -4, 4, -2, 2, 0] }
              : { rotate: 0 }),
          }}
          transition={
            !seen && !reduce && !open
              ? {
                  opacity: { duration: 0.2, ease },
                  scale: { duration: 0.2, ease },
                  rotate: {
                    duration: 0.7,
                    ease: "easeInOut",
                    repeat: 3,
                    repeatDelay: 4,
                    delay: 2,
                  },
                }
              : { duration: 0.2, ease }
          }
          onTap={handleToggle}
          whileTap={open ? undefined : { scale: 0.97 }}
          className={`w-[96px] h-[96px] rounded-[26px] cursor-pointer select-none border-[3px] border-background bg-card group shadow-[0_8px_32px_rgba(0,0,0,0.2),0_2px_8px_rgba(0,0,0,0.12)] ${
            open ? "pointer-events-none" : ""
          }`}
          aria-label={`Meet ${name}`}
          aria-expanded={open}
          aria-hidden={open}
          tabIndex={open ? -1 : 0}
        >
          {!open && (
            <motion.span
              layoutId={morphId}
              className="absolute inset-0 rounded-[23px] overflow-hidden"
              style={{ borderRadius: 23 }}
            >
              <AvatarMedia src={avatarSrc} name={name} sizes="96px" fontSize={40} />
            </motion.span>
          )}
        </motion.button>
      )}
    </>
  );
}

export default MemojiWidget;
