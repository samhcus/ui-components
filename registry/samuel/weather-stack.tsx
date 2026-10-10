"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Plus,
  MapPin,
  X,
  Search,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Map a WMO weather code to a monochrome Lucide glyph (site chrome stays monochrome).
 * Sized with an explicit numeric `size` (sets the SVG's width/height attributes directly)
 * rather than a Tailwind arbitrary class, so it always renders at the right size regardless
 * of build/content-scan quirks. */
function WeatherIcon({ code, size = 15, className }: { code: number | null; size?: number; className?: string }) {
  if (code == null) {
    return (
      <span aria-hidden className={cn("inline-block shrink-0 text-center opacity-40", className)} style={{ width: size }}>
        ·
      </span>
    );
  }
  const Icon =
    code === 0 ? Sun
    : code <= 2 ? CloudSun
    : code === 3 ? Cloud
    : code <= 48 ? CloudFog
    : code <= 57 ? CloudDrizzle
    : code <= 67 ? CloudRain
    : code <= 77 ? CloudSnow
    : code <= 82 ? CloudRain
    : code <= 86 ? CloudSnow
    : CloudLightning;
  return <Icon size={size} strokeWidth={2} className={cn("shrink-0", className)} aria-hidden />;
}

type Loc = {
  id: string;
  name: string;
  timezone: string;
  temp: number | null;
  code: number | null;
  fixed?: boolean; // Seattle is always present
};

/** A geocoding suggestion, shown live as the visitor types. */
type Geo = {
  id: string;
  name: string;
  label: string; // "region, country" to disambiguate same-named places
  lat: number;
  lon: number;
  timezone: string;
};

async function fetchWeather(lat: number, lon: number) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`,
    );
    const d = await r.json();
    if (!d?.current) return null;
    return {
      temp: Math.round(d.current.temperature_2m),
      code: d.current.weather_code as number,
      timezone: d.timezone as string,
    };
  } catch {
    return null;
  }
}

/** Forward-geocode free text to up to five candidate places (open-meteo, no key, CORS-ok). */
async function geocode(q: string): Promise<Geo[]> {
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`,
    );
    const d = await r.json();
    const hits = (d?.results ?? []) as Array<{
      id: number;
      name: string;
      admin1?: string;
      country?: string;
      country_code?: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }>;
    return hits.map((h) => ({
      id: String(h.id),
      name: h.name,
      label: [h.admin1, h.country || h.country_code].filter(Boolean).join(", "),
      lat: h.latitude,
      lon: h.longitude,
      timezone: h.timezone,
    }));
  } catch {
    return [];
  }
}

const SEATTLE = { lat: 47.6062, lon: -122.3321 };

/**
 * A frosted-glass weather + local-time widget that floats over the reading gif.
 * Seattle is always shown; "Add yours" expands the glass into a search field that
 * geocodes as you type and lists live candidates so you can pick the exact place
 * (or use the visitor's own location). Each added row shows current weather and the
 * place's local time, ticking on its own IANA timezone, and can be removed — the
 * remove control only surfaces on hover, in the trailing slot, so it never reserves
 * empty space. The widget is positioned by its parent as an overlay, so expanding it
 * never reflows anything else on the gif.
 */
export function WeatherStack() {
  const [locs, setLocs] = useState<Loc[]>([
    { id: "seattle", name: "Seattle", timezone: "America/Los_Angeles", temp: null, code: null, fixed: true },
  ]);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [coarse, setCoarse] = useState(false); // touch: no hover to reveal on, so keep it shown
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Geo[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setCoarse(window.matchMedia?.("(hover: none)").matches ?? false);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchWeather(SEATTLE.lat, SEATTLE.lon).then((w) => {
      if (!alive || !w) return;
      setLocs((prev) => prev.map((l) => (l.id === "seattle" ? { ...l, temp: w.temp, code: w.code } : l)));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Live suggestions: debounce the typed query and geocode candidates, keeping only
  // the newest request's results so a slow response can't clobber a fresh one.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++seqRef.current;
    const t = setTimeout(async () => {
      const hits = await geocode(q);
      if (seq !== seqRef.current) return; // a newer keystroke superseded this one
      setResults(hits);
      setActive(0);
      setSearching(false);
      setError(hits.length ? null : "No matches");
    }, 260);
    return () => clearTimeout(t);
  }, [query]);

  const fmtTime = (tz: string) =>
    now ? new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(now) : "";

  const addPlace = async (hit: Geo) => {
    // Optimistically drop the search UI; the row fills in weather when it lands.
    setQuery("");
    setResults([]);
    setError(null);
    if (locs.some((l) => l.name === hit.name && l.timezone === hit.timezone)) {
      inputRef.current?.focus();
      return;
    }
    const w = await fetchWeather(hit.lat, hit.lon);
    setLocs((prev) =>
      prev.some((l) => l.name === hit.name && l.timezone === hit.timezone)
        ? prev
        : [
            ...prev,
            { id: `${hit.id}-${hit.lat.toFixed(2)}`, name: hit.name, timezone: hit.timezone, temp: w?.temp ?? null, code: w?.code ?? null },
          ],
    );
    inputRef.current?.focus();
  };

  const addByLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location unavailable");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
        const tz = w?.timezone || "UTC";
        const name = tz.split("/").pop()?.replace(/_/g, " ") || "My location";
        setLocs((prev) =>
          prev.some((l) => l.timezone === tz && l.name === name)
            ? prev
            : [...prev, { id: `me-${tz}`, name, timezone: tz, temp: w?.temp ?? null, code: w?.code ?? null }],
        );
        setBusy(false);
      },
      () => {
        setError("Location denied");
        setBusy(false);
      },
      { timeout: 8000 },
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      addPlace(results[active]);
    } else if (e.key === "Escape") {
      if (results.length) {
        setResults([]);
        setQuery("");
      } else {
        setOpen(false);
      }
    }
  };

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false);
      }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={cn(
        "relative w-[184px] overflow-hidden rounded-2xl text-white/90 sm:w-[200px]",
        "border border-white/20 bg-white/[0.08] backdrop-blur-2xl backdrop-saturate-150",
        "shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/10",
      )}
    >
      {/* soft top sheen so the glass reads as a lit surface, not a flat tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />

      <motion.div layout className="flex flex-col divide-y divide-white/[0.08]">
        <AnimatePresence initial={false}>
          {locs.map((loc) => (
            <motion.div
              key={loc.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="group/loc flex items-center gap-2 px-3 py-1.5 text-[11px]"
            >
              <WeatherIcon code={loc.code} size={15} className="text-white" />
              <span className="font-medium tabular-nums">{loc.temp != null ? `${loc.temp}°` : "··"}</span>
              <span className="truncate">{loc.name}</span>

              {/* Trailing slot: local time at rest, remove control in the same cell so it
                  reserves no space. On hover devices the X is an overlay revealed only on
                  hover (and only then click-armed); on touch it becomes a plain inline
                  control, since there is no hover to reveal it. */}
              <span className="relative ml-auto flex shrink-0 items-center tabular-nums">
                <span
                  className={cn(
                    "block text-white/60 transition-opacity duration-150",
                    !loc.fixed && "[@media(hover:hover)]:group-hover/loc:opacity-0",
                  )}
                >
                  {fmtTime(loc.timezone)}
                </span>
                {!loc.fixed && (
                  <button
                    type="button"
                    onClick={() => setLocs((prev) => prev.filter((l) => l.id !== loc.id))}
                    aria-label={`Remove ${loc.name}`}
                    className={cn(
                      "flex items-center justify-end text-white/60 transition-[opacity,transform] duration-150 active:scale-90",
                      // touch: plain inline control, always tappable (no hover to reveal it)
                      "ml-1.5",
                      // hover devices: absolute overlay in the time slot, armed only on hover
                      "[@media(hover:hover)]:absolute [@media(hover:hover)]:inset-0 [@media(hover:hover)]:ml-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:pointer-events-none",
                      "[@media(hover:hover)]:group-hover/loc:pointer-events-auto [@media(hover:hover)]:group-hover/loc:opacity-100 [@media(hover:hover)]:hover:text-white",
                    )}
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden border-t border-white/[0.08]"
          >
            <div className="flex items-center gap-1.5 px-3 py-2">
              <Search size={12} className="shrink-0 text-white/45" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search a city"
                autoComplete="off"
                spellCheck={false}
                className="w-full min-w-0 bg-transparent text-[11px] text-white outline-none placeholder:text-white/45"
              />
              <button
                type="button"
                onClick={addByLocation}
                aria-label="Use my location"
                className="shrink-0 text-white/70 transition-[color,transform] active:scale-90 [@media(hover:hover)]:hover:text-white"
              >
                {busy ? (
                  <span className="block h-[13px] w-[13px] animate-spin rounded-full border-[1.5px] border-white/40 border-t-white" />
                ) : (
                  <MapPin size={13} />
                )}
              </button>
            </div>

            {/* Live candidate list — pick the exact place before committing. */}
            <AnimatePresence initial={false}>
              {results.length > 0 && (
                <motion.ul
                  layout
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden border-t border-white/[0.08]"
                >
                  {results.map((hit, i) => (
                    <li key={hit.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => addPlace(hit)}
                        className={cn(
                          "flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[11px] transition-[background-color,transform] active:scale-[0.98]",
                          i === active ? "bg-white/[0.14] text-white" : "text-white/75 [@media(hover:hover)]:hover:bg-white/[0.08]",
                        )}
                      >
                        <span className="shrink-0 whitespace-nowrap font-medium">{hit.name}</span>
                        {hit.label && <span className="min-w-0 flex-1 truncate text-white/45">{hit.label}</span>}
                        <Plus size={12} strokeWidth={2.5} className="ml-auto shrink-0 text-white/40" />
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            {(searching || error) && (
              <p
                className={cn(
                  "px-3 pb-1.5 pt-0.5 text-[10px]",
                  error && !searching ? "text-red-300/90" : "text-white/45",
                )}
              >
                {searching ? "Searching…" : error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Add yours" is a quiet affordance: it only reveals when the widget is
          hovered (or already open, or on touch where there's no hover to reveal on),
          so at rest the widget reads as a clean weather readout. */}
      <AnimatePresence initial={false}>
        {(hovered || open || coarse) && (
          <motion.button
            layout
            type="button"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => {
              setOpen((o) => !o);
              setError(null);
              if (open) {
                setQuery("");
                setResults([]);
              } else {
                setTimeout(() => inputRef.current?.focus(), 60);
              }
            }}
            aria-expanded={open}
            className="flex w-full items-center gap-1.5 overflow-hidden border-t border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/70 transition-[color,transform] active:scale-[0.98] [@media(hover:hover)]:hover:text-white"
          >
            <span className={cn("transition-transform duration-200", open && "rotate-45")}>
              <Plus size={12} strokeWidth={2.5} />
            </span>
            {open ? "Done" : "Add yours"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
