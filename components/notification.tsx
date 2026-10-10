"use client";

import Image from "next/image";
import { toast, type ExternalToast } from "sonner";
import { BellSimple, Check, Info, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { playSound, type SoundName } from "@/lib/ui-sound";

/**
 * The one notification the whole site uses. A single self-contained card holds
 * everything: the avatar (Samuel's memoji, or a system glyph) sits inside the same
 * card as the text, never a detached bubble. Rendered through sonner as a custom,
 * unstyled toast so it inherits the top-center stack, timing, and dismissal.
 *
 *   notify.samuel("Thanks for playing 👋")
 *   notify.system("Drawing is on", "Turn it off to scroll")
 *   notify.success("Copied")   notify.error("Couldn't copy")
 */

type SysKind = "system" | "success" | "error" | "info";

const SYS: Record<SysKind, { icon: React.ReactNode; accent: string }> = {
  system: { icon: <BellSimple size={16} weight="bold" />, accent: "text-foreground" },
  success: { icon: <Check size={16} weight="bold" />, accent: "text-emerald-600 dark:text-emerald-400" },
  error: { icon: <WarningCircle size={16} weight="bold" />, accent: "text-red-600 dark:text-red-400" },
  info: { icon: <Info size={16} weight="bold" />, accent: "text-foreground" },
};

function Shell({
  avatar,
  title,
  description,
}: {
  avatar: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-[330px] max-w-[92vw] items-start gap-3 rounded-[16px] border border-border bg-popover/90 px-3.5 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl"
    >
      <span className="mt-px shrink-0">{avatar}</span>
      <div className="min-w-0 flex-1 pt-px">
        <p className="text-[13px] font-semibold leading-tight text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

const SamuelAvatar = (
  <Image
    src="/brand/samuel-memoji.png"
    alt=""
    width={44}
    height={44}
    className="h-9 w-9 rounded-[12px] object-cover object-top ring-1 ring-border"
  />
);

const sysAvatar = (kind: SysKind) => (
  <span
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-[11px] bg-muted ring-1 ring-inset ring-border",
      SYS[kind].accent,
    )}
  >
    {SYS[kind].icon}
  </span>
);

const soundedAt = new Map<string | number, number>();
const custom = (node: React.ReactNode, opts?: ExternalToast, sound: SoundName = "ding") => {
  const now = performance.now();
  for (const [id, until] of soundedAt) if (until <= now) soundedAt.delete(id);
  if (opts?.id === undefined || !soundedAt.has(opts.id)) {
    playSound(sound);
    if (opts?.id !== undefined) soundedAt.set(opts.id, now + (opts.duration ?? 4000));
  }
  return toast.custom(() => <>{node}</>, { duration: 4000, ...opts });
};

export const notify = {
  /** A message from Samuel, wearing his memoji. */
  samuel(message: string, opts?: ExternalToast) {
    return custom(<Shell avatar={SamuelAvatar} title="Samuel" description={message} />, { duration: 4200, ...opts });
  },
  system(title: string, description?: string, opts?: ExternalToast) {
    return custom(<Shell avatar={sysAvatar("system")} title={title} description={description} />, opts);
  },
  success(title: string, description?: string, opts?: ExternalToast) {
    return custom(<Shell avatar={sysAvatar("success")} title={title} description={description} />, opts, "success");
  },
  error(title: string, description?: string, opts?: ExternalToast) {
    return custom(<Shell avatar={sysAvatar("error")} title={title} description={description} />, opts, "error");
  },
  info(title: string, description?: string, opts?: ExternalToast) {
    return custom(<Shell avatar={sysAvatar("info")} title={title} description={description} />, opts);
  },
};
