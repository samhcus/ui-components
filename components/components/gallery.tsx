"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Terminal, Sparkles, Search, X } from "lucide-react";
import { cn, EASE } from "@/lib/utils";
import { type CatalogItem, type ComponentCategory, CATEGORY_ORDER } from "@/lib/components/catalog";
import { PREVIEWS } from "@/components/components/previews";

type Item = CatalogItem & { code: string; files: { path: string; content: string }[] };

const REGISTRY_BASE = "https://ui.samhc.us/r";

const urlFor = (slug: string) => `${REGISTRY_BASE}/${slug}.json`;
const installFor = (slug: string) => `npx shadcn@latest add ${urlFor(slug)}`;
const promptFor = (item: Item) =>
  `Add the "${item.name}" component to my project by installing it from the shadcn registry: ${installFor(
    item.slug,
  )}`;

function useCopy() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFailed(false);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setFailed(true);
    }
  };
  return { copied, failed, copy };
}

function CopyButton({
  value,
  label,
  icon,
  className,
}: {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const { copied, failed, copy } = useCopy();
  return (
    <button
      title={failed ? "Copy unavailable. Select and copy the text manually." : undefined}
      onClick={(e) => {
        e.stopPropagation();
        copy(value);
      }}
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-[11.5px] text-muted-foreground transition-[color,transform] duration-150 [transition-timing-function:var(--ease-out)] hover:text-foreground active:scale-95",
        className,
      )}
      aria-label={copied ? "Copied" : label ?? "Copy"}
    >
      {copied ? <Check size={13} className="text-primary" /> : icon ?? <Copy size={13} />}
      <span className="sr-only" role="status">{copied ? "Copied to clipboard" : failed ? "Copy unavailable. Select and copy the text manually." : ""}</span>
      {failed && <span>Copy unavailable</span>}
      {label !== undefined && (
        <span className={copied ? "text-primary" : ""}>{copied ? "Copied" : label}</span>
      )}
    </button>
  );
}

/* Mounts a preview only once it is near the viewport. All previews are live
   components (typewriters, physics loops, canvas/WebGL render loops, even a live
   weather fetch) — mounting every one on load ran the page hot and fired network
   calls for cards nobody had scrolled to. IntersectionObserver defers each until
   it is within 400px of view, then keeps it mounted. The preview is fully
   interactive in place: you drive the real component inside its own panel, and
   its effects stay contained to that panel. */
function LazyPreview({ render }: { render?: () => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setShow(true), 0);
      return () => clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} className="relative flex max-w-full items-center justify-center">
      {show && render ? render() : null}
    </div>
  );
}

/* A calm, preview-first card in the manner of a real component catalog: a big
   LIVE, interactable demo you can drive right inside its own panel. The grid
   itself is dead still — no hover lift, no scale, no sibling blur — so the only
   thing that ever moves is the component you're touching, and its effects stay
   contained to its panel. The footer carries the name and a Code button that
   opens the detail drawer (install command + full source). Clicking the demo
   drives the demo; only the Code button reflows nothing but the drawer. */
function ComponentCard({ item, onOpenCode }: { item: Item; onOpenCode: () => void }) {
  const preview = PREVIEWS[item.slug];
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left">
      {/* Live, interactable preview. `isolation: isolate` gives the panel its own
          stacking + containment context so a demo's absolutely-positioned bits
          can't escape into a neighbour, while portalled overlays (tooltips,
          dialogs, toasts) still surface above the page as intended. */}
      <div className="relative flex min-h-[188px] flex-1 items-center justify-center overflow-hidden bg-muted/30 p-8 [isolation:isolate] max-md:min-h-[150px] max-md:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 32%, var(--muted), transparent 72%)",
          }}
        />
        <LazyPreview render={preview} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <h3 className="truncate text-[13px] font-medium text-foreground">{item.name}</h3>
        <button
          type="button"
          onClick={onOpenCode}
          aria-label={`View ${item.name} code`}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground outline-none transition-[color,border-color] duration-150 [transition-timing-function:var(--ease-out)] hover:border-foreground/20 hover:text-foreground active:scale-[0.97] focus-visible:border-foreground/25"
        >
          <Terminal size={12} className="opacity-70" />
          Code
        </button>
      </div>
    </div>
  );
}

/* The flagship. A full-width hero at the very top of the gallery: a large live
   stage on the left where you can actually drive the featured component, and its
   name, blurb, and install on the right. Promoted OUT of the category grid (so it
   never shows twice) — its size and placement are what mark it featured, no badge. */
function FeaturedHero({ item, onOpenCode }: { item: Item; onOpenCode: () => void }) {
  const preview = PREVIEWS[item.slug];
  const cmd = installFor(item.slug);
  return <section className="library-spotlight" aria-label="Featured component">
    <div className="library-spotlight-meta">
      <div>
        <p className="library-eyebrow">Featured</p>
        <h2>{item.name}</h2>
        <p>The toolbar from samhc.us. Changes stay inside the example.</p>
      </div>
      <div className="library-spotlight-install">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
          <code className="min-w-0 flex-1 overflow-auto whitespace-nowrap text-[11px]">{cmd}</code>
          <CopyButton value={cmd} />
        </div>
        <div className="library-spotlight-actions">
          <button type="button" onClick={onOpenCode} aria-label={`View ${item.name} source`} className="rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background">View source</button>
          <a href="/r/dynamic-toolbar-example.zip" download className="text-xs underline underline-offset-4">Download example</a>
        </div>
      </div>
    </div>
    {preview?.()}
  </section>;
}

/* A stable right-side drawer. Lives in a portal-free fixed overlay so the grid
   underneath never moves. Shows the live preview, install command, an
   agent-ready prompt, dependencies, and the full source. */
function DetailDrawer({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const [fileIndex, setFileIndex] = useState(0);

  useEffect(() => {
    if (!item) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const inertElements: { element: HTMLElement; previous: boolean }[] = [];
    let modal = panelRef.current?.parentElement;
    while (modal?.parentElement && modal !== document.body) {
      for (const sibling of Array.from(modal.parentElement.children)) {
        if (sibling !== modal && sibling instanceof HTMLElement) { inertElements.push({ element: sibling, previous: sibling.inert }); sibling.inert = true; }
      }
      modal = modal.parentElement;
    }
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, iframe, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
    const timer = setTimeout(() => focusables()[0]?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = focusables(); const first = list[0]; const last = list[list.length - 1];
        if (e.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    // Lock scroll via an inline style, not the `overflow-hidden` class: some
    // previews (morphing-dialog, book-cover) toggle that exact class on their own
    // and would otherwise unlock the page behind this still-open drawer. Inline
    // style outranks the class and is saved/restored precisely.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      for (const { element, previous } of inertElements) element.inert = previous;
      previousFocus?.focus();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  const preview = item ? PREVIEWS[item.slug] : undefined;
  const cmd = item ? installFor(item.slug) : "";
  const file = item?.files[fileIndex] ?? item?.files[0];

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${item.name} details`}
            className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-border bg-background shadow-[0_0_60px_rgba(0,0,0,0.18)]"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={reduce ? { duration: 0.2 } : { duration: 0.3, ease: EASE }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 max-md:px-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-foreground">{item.name}</h2>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground/70">
                    {item.category}
                  </span>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground outline-none transition-[color,background-color,transform] hover:bg-muted hover:text-foreground active:scale-90 max-md:p-2.5"
              >
                <X size={17} />
              </button>
            </div>

            {/* Scroll body */}
            <div className="flex-1 overflow-y-auto">
              {/* Live preview */}
              <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden border-b border-border bg-muted/30 p-8 max-md:min-h-[180px] max-md:p-5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 32%, var(--muted), transparent 72%)",
                  }}
                />
                <div className="relative max-w-full overflow-hidden">{preview ? preview() : null}</div>
              </div>

              <div className="space-y-4 px-5 py-5 max-md:px-4">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{item.tagline}</p>

                {/* Install */}
                <div>
                  <p className="mb-1.5 text-[11.5px] font-medium text-foreground">Install</p>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
                    <Terminal size={14} className="shrink-0 text-muted-foreground/55" />
                    <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-foreground">
                      {cmd}
                    </code>
                    <CopyButton value={cmd} />
                  </div>
                </div>

                {/* Agent prompt + deps */}
                <div className="flex items-center justify-between gap-3">
                  <CopyButton
                    value={promptFor(item)}
                    label="Copy prompt"
                    icon={<Sparkles size={13} />}
                  />
                  <span className="text-[11px] text-muted-foreground/45">
                    {item.dependencies.length > 0
                      ? item.dependencies.join(" · ")
                      : "no dependencies"}
                  </span>
                </div>

                {item.slug === "dynamic-toolbar" && <p className="text-xs leading-relaxed text-muted-foreground">This is the unchanged production Toolbar and its support files. Read the included setup guide for providers, fonts, global styles, and assets. Requires Next.js App Router.</p>}
                {item.files.length > 1 && <label className="block text-xs">Source file<select value={fileIndex} onChange={e => setFileIndex(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-border bg-background p-2">{item.files.map((f, index) => <option value={index} key={f.path}>{f.path}</option>)}</select></label>}
                <a href={`/r/${item.slug}.json`} download className="inline-block text-xs underline underline-offset-4">Download all source files</a>
                {/* Source */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[10.5px] text-muted-foreground/45">
                      {file?.path ?? item.slug}
                    </span>
                    <CopyButton value={file?.content ?? item.code} label="Copy" />
                  </div>
                  <pre className="max-h-[320px] overflow-auto rounded-xl border border-border bg-card px-4 py-3 text-[11px] leading-relaxed">
                    <code className="font-mono text-muted-foreground">{file?.content ?? item.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ComponentsGallery({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<ComponentCategory | "All">("All");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // The flagship is promoted to the hero and pulled OUT of the grid, so the rail
  // counts and category sections only ever reflect what's actually in the grid.
  const featured = useMemo(() => items.find((i) => i.featured) ?? null, [items]);
  const gridItems = items;

  // Per-category totals for the sidebar (independent of search/filter).
  const counts = useMemo(() => {
    const m = new Map<ComponentCategory, number>();
    for (const item of gridItems) m.set(item.category, (m.get(item.category) ?? 0) + 1);
    return m;
  }, [gridItems]);

  // Sections in canonical category order; each respects the active category AND
  // the search query. Empty sections drop out entirely.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (i: Item) =>
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.tagline.toLowerCase().includes(q) ||
      i.tags.some((t) => t.includes(q)) ||
      i.category.toLowerCase().includes(q);
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      list:
        activeCat !== "All" && activeCat !== cat
          ? ([] as Item[])
          : gridItems.filter((i) => i.category === cat && matches(i) && (!i.featured || activeCat !== "All" || !!q)),
    })).filter((s) => s.list.length > 0);
  }, [gridItems, query, activeCat]);

  const total = gridItems.length;
  const closeItem = useCallback(() => setOpenSlug(null), []);
  useEffect(() => {
    const read = () => { const params = new URLSearchParams(window.location.search); setQuery(params.get("q") ?? ""); const category = params.get("category"); setActiveCat(CATEGORY_ORDER.includes(category as ComponentCategory) ? category as ComponentCategory : "All"); setOpenSlug(params.get("component")); };
    read(); window.addEventListener("popstate", read); return () => window.removeEventListener("popstate", read);
  }, []);
  const updateURL = (key: string, value: string) => { const url = new URL(window.location.href); if (value) url.searchParams.set(key, value); else url.searchParams.delete(key); window.history.replaceState(null, "", url); };
  const chooseCategory = (category: ComponentCategory | "All") => { setActiveCat(category); updateURL("category", category === "All" ? "" : category); };
  const search = (value: string) => { setQuery(value); updateURL("q", value); };
  const open = (slug: string) => { setOpenSlug(slug); updateURL("component", slug); };
  const close = useCallback(() => { closeItem(); const url = new URL(window.location.href); url.searchParams.delete("component"); window.history.replaceState(null, "", url); }, [closeItem]);

  const openItem = items.find((i) => i.slug === openSlug) ?? null;

  const navItems: { key: ComponentCategory | "All"; label: string; count: number }[] = [
    { key: "All", label: "All", count: total },
    ...CATEGORY_ORDER.map((cat) => ({ key: cat, label: cat, count: counts.get(cat) ?? 0 })),
  ];

  return (
    <section className="library-gallery px-8 pt-12 pb-24 min-[1700px]:px-14 max-md:px-4 max-md:pt-10 max-md:pb-16">
      {/* Mobile header — the phone canvas has no left rail, so Samuel's mark
          sits top-left over the search + category strip. */}
      <div className="library-mobile md:hidden">
        <div className="relative mt-6">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search components"
            aria-label="Search components"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => search("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground/60 transition-[color,transform] hover:text-foreground active:scale-90"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => chooseCategory(n.key)}
              aria-pressed={activeCat === n.key}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]",
                activeCat === n.key
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {n.label} <span className="opacity-55">{n.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: sticky rail — Samuel's wordmark top-left, then the search, then
          the category nav — beside the full-width grid. No dead margins. */}
      <div className="library-columns flex gap-10 max-md:mt-6 max-md:gap-0 min-[1700px]:gap-14">
        <aside className="library-rail hidden w-64 shrink-0 md:block">
          <div className="sticky top-12 flex flex-col gap-5">
            <p className="library-eyebrow">Categories</p>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => search(e.target.value)}
                placeholder="Search"
                aria-label="Search components"
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => search("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/60 transition-[color,transform] hover:text-foreground active:scale-90"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => chooseCategory(n.key)}
                  aria-pressed={activeCat === n.key}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] outline-none transition-[color,background-color,transform] duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98]",
                    activeCat === n.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="font-medium">{n.label}</span>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      activeCat === n.key ? "text-background/55" : "text-muted-foreground/45",
                    )}
                  >
                    {n.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="library-heading"><h1>Components</h1></div>
          {/* Flagship hero — only in the default browse view, so a search or a
              category filter keeps the results focused. */}
          {featured && activeCat === "All" && !query.trim() && (
            <FeaturedHero item={featured} onOpenCode={() => open(featured.slug)} />
          )}
          {sections.length > 0 ? (
            <div className="flex flex-col gap-14">
              {sections.map((s) => (
                <div key={s.cat} className="scroll-mt-28">
                  <div className="mb-5 flex items-baseline gap-2.5 border-b border-border pb-2.5">
                    <h2 className="text-[16px] font-semibold text-foreground">{s.cat}</h2>
                    <span className="text-[12px] tabular-nums text-muted-foreground/45">
                      {s.list.length}
                    </span>
                  </div>
                  <div className="library-grid grid grid-cols-1 gap-4 md:grid-cols-2 min-[1400px]:grid-cols-3 min-[1760px]:grid-cols-4 min-[2160px]:grid-cols-5 max-md:gap-3">
                    {s.list.map((item) => (
                      <ComponentCard
                        key={item.slug}
                        item={item}
                        onOpenCode={() => open(item.slug)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <p className="text-[14px] font-medium text-foreground">No components match that</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Try a different word, or pick another category.
              </p>
              <button type="button" onClick={() => { search(""); chooseCategory("All"); }} className="mt-5 rounded-lg border border-border px-4 py-2 text-xs">Clear filters</button>
            </div>
          )}
        </div>
      </div>

      <DetailDrawer key={openItem?.slug ?? "closed"} item={openItem} onClose={close} />
    </section>
  );
}
