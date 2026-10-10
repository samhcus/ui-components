"use client";
import { playSound } from "@/lib/ui-sound";
export function AssetSounds() { return <div className="flex flex-wrap justify-center gap-2">{(["tick", "expand", "success"] as const).map(sound => <button type="button" key={sound} onClick={() => playSound(sound)} className="rounded-full border border-border bg-background px-4 py-2 text-xs">Play {sound}</button>)}</div>; }
