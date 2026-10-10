import type { Metadata } from "next";
import { ReadingGifPanel } from "@/registry/samuel/reading-gif-panel";

export const metadata: Metadata = { title: "Original Reading GIF Panel", robots: { index: false, follow: false } };

export default function ReadingPanelExample() {
  return <main className="px-6 pt-12 pb-7"><div className="mx-auto max-w-2xl"><ReadingGifPanel /></div></main>;
}
