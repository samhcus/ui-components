"use client";

import { useRef, useState } from "react";
import { Play, Pause, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function fmt(s: number): string {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * A small custom video player: click-to-play, a draggable scrubber, time
 * readout, and a mute + volume control. Native <video> under the hood, styled
 * chrome on top. Controls show on hover and whenever the video is paused.
 */
export function VideoPlayer({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const seek = (val: number) => {
    const v = ref.current;
    if (v) v.currentTime = val;
    setCur(val);
  };

  const changeVol = (val: number) => {
    const v = ref.current;
    if (v) {
      v.volume = val;
      v.muted = val === 0;
    }
    setVol(val);
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = ref.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next && v.volume === 0) changeVol(1);
  };

  return (
    <div className={cn("group relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-black", className)}>
      <video
        ref={ref}
        src={src}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDur(e.currentTarget.duration);
          e.currentTarget.volume = vol;
        }}
      />

      {/* big play affordance while paused */}
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-black/40 text-white backdrop-blur-md transition-transform duration-150 active:scale-90">
            <Play size={22} weight="fill" className="ml-0.5" />
          </span>
        </button>
      )}

      {/* control bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-2.5 pt-8 text-white transition-opacity duration-200",
          playing ? "opacity-0 group-hover:opacity-100 [&:focus-within]:opacity-100" : "opacity-100",
        )}
      >
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="shrink-0 transition-transform active:scale-90">
          {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
        </button>

        <span className="shrink-0 text-[11px] tabular-nums text-white/80">{fmt(cur)}</span>

        <input
          type="range"
          min={0}
          max={dur || 0}
          step={0.01}
          value={cur}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          className="h-2.5 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-[10px] [&::-webkit-slider-runnable-track]:rounded-[4px] [&::-webkit-slider-runnable-track]:bg-white/25 [&::-webkit-slider-thumb]:mt-[1px] [&::-webkit-slider-thumb]:h-[8px] [&::-webkit-slider-thumb]:w-[8px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_2px_rgba(0,0,0,0.4)] [&::-moz-range-track]:h-[10px] [&::-moz-range-track]:rounded-[4px] [&::-moz-range-track]:bg-white/25 [&::-moz-range-thumb]:h-[8px] [&::-moz-range-thumb]:w-[8px] [&::-moz-range-thumb]:rounded-[3px] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
        />

        <span className="shrink-0 text-[11px] tabular-nums text-white/60">{fmt(dur)}</span>

        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="shrink-0 transition-transform active:scale-90">
          {muted || vol === 0 ? <SpeakerSlash size={16} weight="fill" /> : <SpeakerHigh size={16} weight="fill" />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : vol}
          onChange={(e) => changeVol(Number(e.target.value))}
          aria-label="Volume"
          className="h-2.5 w-14 shrink-0 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-[10px] [&::-webkit-slider-runnable-track]:rounded-[4px] [&::-webkit-slider-runnable-track]:bg-white/25 [&::-webkit-slider-thumb]:mt-[1px] [&::-webkit-slider-thumb]:h-[8px] [&::-webkit-slider-thumb]:w-[8px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_2px_rgba(0,0,0,0.4)] [&::-moz-range-track]:h-[10px] [&::-moz-range-track]:rounded-[4px] [&::-moz-range-track]:bg-white/25 [&::-moz-range-thumb]:h-[8px] [&::-moz-range-thumb]:w-[8px] [&::-moz-range-thumb]:rounded-[3px] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
        />
      </div>
    </div>
  );
}
