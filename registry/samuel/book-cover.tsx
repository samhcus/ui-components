"use client";

import * as React from "react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BookCover — a cover image that lifts and pops on hover, then morphs open into
 * a detail dialog: the cover flies to the top-left of a card carrying the title,
 * author, blurb, and a purchase link. Self-contained morph (motion `layoutId`
 * + a portalled backdrop), closes on Escape, backdrop click, or the X. Set
 * `about`/`buyHref` to unlock the dialog; omit them for a plain lift-on-hover
 * cover.
 */
export function BookCover({
  cover,
  title,
  author,
  about,
  buyHref,
  buyLabel = "Purchase",
  status,
  width = 72,
  className,
}: {
  /** Cover image URL. */
  cover: string;
  title: string;
  author: string;
  /** A few sentences shown in the opened dialog. */
  about?: string;
  /** Purchase link; renders the green button when set. */
  buyHref?: string;
  buyLabel?: string;
  /** Small status line, e.g. "Currently reading". */
  status?: string;
  /** Cover width in px at rest. */
  width?: number;
  className?: string;
}) {
  const uid = useId();
  const layoutId = `book-${uid}`;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const hasDetail = Boolean(about || buyHref);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  const transition = reduce
    ? { duration: 0 }
    : { type: "spring" as const, bounce: 0.05, duration: 0.32 };

  return (
    <>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => hasDetail && setOpen(true)}
        aria-label={hasDetail ? `Open ${title}` : title}
        style={{ width, borderRadius: 8 }}
        className={cn(
          "block overflow-hidden border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] outline-none transition-transform duration-200 ease-out active:scale-[0.97] [@media(hover:hover)]:hover:scale-[1.06]",
          hasDetail ? "cursor-pointer" : "cursor-default",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={`${title} cover`} className="h-auto w-full object-cover" />
      </motion.button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    layoutId={layoutId}
                    transition={transition}
                    role="dialog"
                    aria-modal="true"
                    style={{ borderRadius: 16 }}
                    className="pointer-events-auto relative flex w-full max-w-[420px] flex-col overflow-hidden border border-border bg-background shadow-[0_32px_80px_rgba(0,0,0,0.22)]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X size={16} />
                    </button>

                    <div className="flex gap-4 p-5">
                      <div className="w-[92px] shrink-0 overflow-hidden rounded-2xl border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cover} alt="" className="h-auto w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                          {title}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-muted-foreground/70">{author}</p>
                        {status && (
                          <span className="mt-2.5 inline-block text-[11px] text-muted-foreground/50">
                            {status}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasDetail && (
                      <motion.div
                        className="px-5 pb-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: reduce ? 0 : 0.1 }}
                      >
                        {about && (
                          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                            {about}
                          </p>
                        )}
                        {buyHref && (
                          <a
                            href={buyHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex select-none items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-medium text-white transition-[background-color,transform] duration-150 [@media(hover:hover)]:hover:bg-[#15803D] active:scale-[0.98]"
                          >
                            <ShoppingCart size={15} strokeWidth={2.5} /> {buyLabel}
                          </a>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

export default BookCover;
