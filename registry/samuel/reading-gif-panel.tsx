"use client";

import Image from "next/image";
import { ShoppingCartSimple } from "@phosphor-icons/react";
import { reading, buyLink, type Book } from "@/components/reading-panel/reading-data";
import { SocialDock } from "@/components/reading-panel/social-dock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "@/components/reading-panel/social-dock.css";
import {
  MorphingDialog, MorphingDialogTrigger, MorphingDialogContainer,
  MorphingDialogContent, MorphingDialogTitle, MorphingDialogSubtitle,
  MorphingDialogDescription,
} from "@/components/motion-primitives/morphing-dialog";

const DESC_VARIANTS = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.97 },
};

/** A book cover over the footage; click to morph open the full detail + Purchase. */
function BookCover({ book }: { book: Book }) {
  return (
    <MorphingDialog transition={{ type: "spring", bounce: 0.05, duration: 0.28 }}>
      <MorphingDialogTrigger className="group block cursor-pointer">
        <div className="w-[58px] overflow-hidden rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-transform duration-200 ease-out active:scale-[0.97] md:w-[72px] md:rounded-lg">
          <Image
            src={book.cover}
            alt={`${book.title} cover`}
            width={260}
            height={390}
            className="h-auto w-full object-cover"
          />
        </div>
      </MorphingDialogTrigger>

      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{ borderRadius: "16px" }}
          className="pointer-events-auto relative flex w-full flex-col overflow-hidden border border-border bg-background shadow-[0_32px_80px_rgba(0,0,0,0.22)] md:w-[420px]"
        >
          <div className="flex gap-4 p-5">
            <div className="w-[92px] shrink-0 overflow-hidden rounded-2xl border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <Image
                src={book.cover}
                alt=""
                width={260}
                height={390}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <MorphingDialogTitle className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                {book.title}
              </MorphingDialogTitle>
              <MorphingDialogSubtitle className="mt-0.5 text-[12px] text-muted-foreground/70">
                {book.author}
              </MorphingDialogSubtitle>
              <span className="mt-2.5 inline-block text-[11px] text-muted-foreground/50">
                {book.status === "reading" ? "Currently reading" : "Finished"}
              </span>
            </div>
          </div>

          <div className="px-5 pb-5">
            <MorphingDialogDescription disableLayoutAnimation variants={DESC_VARIANTS}>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                {book.about}
              </p>
              <a
                href={buyLink(book)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "mt-5 border-transparent bg-[#16A34A] text-white transition-[background-color,transform] [@media(hover:hover)]:hover:bg-[#15803D] active:scale-[0.98]"
                )}
              >
                <ShoppingCartSimple size={14} weight="bold" /> Purchase
              </a>
            </MorphingDialogDescription>
          </div>
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

/** Original homepage GIF panel, preserved before its social buttons were removed. */
export function ReadingGifPanel() {
  return (
    <div id="reading-gif" className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border md:aspect-[16/7]">
      <img
        src="/reading/reading.gif"
        alt="Reading on a moving train"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
      {/* Legibility scrim — grounds the content over unpredictable footage */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/50" />

      {/* Social links. Tooltips portal to the body, so they clear the gif's clip. */}
      <SocialDock />

      {/* Bottom: current reads (the coffee link now lives in the SocialDock) */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-6">
        <p className="text-[12px] font-medium text-white/75">Currently reading</p>
        {/* Overlapping pile with a slight tilt: World War Z in front, AI Snake
            Oil tucked behind it; the pile straightens + slides apart on hover. */}
        <div className="group/books mt-3 flex w-fit items-end">
          {reading.map((book, i) => (
            <div
              key={book.title}
              className={cn(
                "relative origin-bottom transition-[margin,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                i === 0
                  ? "z-20 -rotate-2 group-hover/books:rotate-0"
                  : "z-10 -ml-8 rotate-3 group-hover/books:ml-2 group-hover/books:rotate-0 md:-ml-10"
              )}
            >
              <BookCover book={book} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
