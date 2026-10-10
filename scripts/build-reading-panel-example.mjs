// Preserve the original source and binary assets in a runnable example.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const snapshot = JSON.parse(read("registry/samuel/reading-panel/provenance.json"));
const sha256 = data => createHash("sha256").update(data).digest("hex");
for (const source of snapshot.sources) {
  if (sha256(read(source.snapshot)) !== source.sha256) throw new Error(`Original snapshot changed: ${source.original}`);
}
for (const [copy, original] of [
  ["components/reading-panel/social-dock.tsx", "components/brand/social-dock.tsx"],
  ["components/reading-panel/reading-data.ts", "lib/reading.ts"],
]) {
  if (sha256(read(copy)) !== snapshot.sources.find(source => source.original === original).sha256) throw new Error(`Preserved component changed: ${copy}`);
}
const original = name => read(snapshot.sources.find(source => source.original === name).snapshot);
const item = JSON.parse(read("registry.json")).items.find(item => item.name === "reading-gif-panel");
const entries = new Map(item.files.map(file => [file.target, read(file.path)]));
for (const source of snapshot.sources) {
  if (source.original.startsWith("public/")) entries.set(source.original, read(source.snapshot));
}
for (const name of ["components/ui/sonner.tsx", "components/brand/ig-gradient.tsx", "components/mobile-scale.tsx"]) entries.set(name, original(name));
const layout = original("app/layout.tsx").toString()
  .replace(/import \{ SiteChrome \}[^\n]+\n/, "")
  .replace("<SiteChrome>{children}</SiteChrome>", '<div id="mh-page">{children}</div>');
entries.set("app/layout.tsx", Buffer.from(layout));
entries.set("app/globals.css", original("app/globals.css"));
entries.set("app/page.tsx", Buffer.from(read("app/examples/reading-gif-panel/page.tsx").toString().replace("@/registry/samuel/reading-gif-panel", "@/components/reading-panel/reading-gif-panel")));
const pkg = JSON.parse(read("package.json"));
entries.set("package.json", Buffer.from(JSON.stringify({ name: "reading-gif-panel-example", private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies }, null, 2)));
for (const path of ["tsconfig.json", "postcss.config.mjs"]) entries.set(path, read(path));
entries.set("README.md", Buffer.from("# Run the original panel\n\nRun `npm install`, then `npm run dev` and open http://localhost:3000.\n\n" + read("docs/components/reading-gif-panel.md")));
entries.set("provenance.json", Buffer.from(JSON.stringify(snapshot, null, 2)));

// Stored ZIP entries, matching the existing toolbar example's dependency-free format.
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; };
const local = [], directory = []; let offset = 0;
for (const [path, content] of entries) {
  const name = Buffer.from(path), crc = crc32(content);
  const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt32LE(crc, 14); header.writeUInt32LE(content.length, 18); header.writeUInt32LE(content.length, 22); header.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt32LE(crc, 16); central.writeUInt32LE(content.length, 20); central.writeUInt32LE(content.length, 24); central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
  local.push(header, name, content); directory.push(central, name); offset += header.length + name.length + content.length;
}
const central = Buffer.concat(directory), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.size, 8); end.writeUInt16LE(entries.size, 10); end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
writeFileSync(new URL("../public/r/reading-gif-panel-example.zip", import.meta.url), Buffer.concat([...local, central, end]));
writeFileSync(new URL("../public/r/reading-gif-panel-provenance.json", import.meta.url), JSON.stringify({ ...snapshot, example: "/examples/reading-gif-panel", archive: "/r/reading-gif-panel-example.zip" }, null, 2) + "\n");
console.log(`Built preserved reading panel example (${entries.size} files)`);
