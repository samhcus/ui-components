import type { Metadata } from "next";
import Link from "next/link";
import { CatMark } from "@/components/brand/cat-mark";
import { SamuelUIWordmark } from "@/components/brand/samuel-ui-wordmark";
import { PixelWordmark } from "@/components/brand/pixel-wordmark";
import { AssetSounds } from "@/components/library/asset-sounds";

export const metadata: Metadata = { title: "Assets · Samuel’s UI Library", alternates: { canonical: "https://ui.samhc.us/assets" } };
const assets = [
  { slug: "cat-mark", name: "Cat mark", format: "SVG / React", preview: <CatMark className="h-20 w-20" /> },
  { slug: "pixel-wordmark", name: "Pixel lettering", format: "React / CSS", preview: <PixelWordmark text="Hello" colors={["#2563eb", "#ef9470", "#e9c64a", "#059669"]} className="text-4xl" /> },
  { slug: "samuel-ui-wordmark", name: "UI wordmark", format: "React / typography", preview: <SamuelUIWordmark showOwner={false} className="text-3xl" /> },
  { slug: "ig-gradient", name: "Gradient definitions", format: "SVG definitions", preview: <svg viewBox="0 0 160 80" className="w-40" aria-label="Warm gradient sample"><rect width="160" height="80" rx="20" fill="url(#ig-gradient)" /></svg> },
];
export default function AssetsPage() { return <main className="library-page">
  <div className="library-heading"><h1>Assets</h1></div>
  <div className="library-resources">{assets.map(asset => <article className="library-resource" key={asset.slug}><div className="asset-preview">{asset.preview}</div><h2>{asset.name}</h2><p className="library-eyebrow">{asset.format}</p><div className="library-resource-actions"><Link href={`/?component=${asset.slug}`}>Preview & source</Link><a href={`/r/${asset.slug}.json`} download>Download registry JSON</a></div></article>)}<article className="library-resource"><div className="asset-preview"><AssetSounds /></div><h2>Interface sounds</h2><p className="library-eyebrow">Web Audio / TypeScript</p><div className="library-resource-actions"><Link href="/?component=web-haptics-demo">Preview & source</Link><a href="/r/web-haptics-demo.json" download>Download sound source</a></div></article></div>
</main>; }
