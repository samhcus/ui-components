// A self-contained example download, with byte-for-byte production toolbar code.
// ZIP uses stored entries and CRC32 so no runtime/build dependencies are needed.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const registry = JSON.parse(read("registry.json"));
const item = registry.items.find(item => item.name === "dynamic-toolbar");
const entries = item.files.filter(file => !file.target.startsWith("docs/") && !file.target.startsWith("styles/")).map(file => [file.target, read(file.path)]);
const layout = read("app/layout.tsx").toString().replace(/import \{ SiteChrome \}[^\n]+\n/, "").replace("<SiteChrome>{children}</SiteChrome>", "<div id=\"mh-page\">{children}</div>");
const pkg = JSON.parse(read("package.json"));
entries.push(["components/brand/ig-gradient.tsx", read("components/brand/ig-gradient.tsx")], ["app/layout.tsx", Buffer.from(layout)], ["app/globals.css", read("app/globals.css")], ["app/page.tsx", read("app/examples/dynamic-toolbar/page.tsx")], ["app/example.css", read("app/examples/dynamic-toolbar/example.css")], ["app/example-components.tsx", read("app/examples/dynamic-toolbar/example-components.tsx")], ...["button", "input", "slider"].map(name => [`components/ui/${name}.tsx`, read(`components/ui/${name}.tsx`)]), ["public/oneko.png", read("public/oneko.png")], ["public/brand/samuel-memoji.png", read("public/brand/samuel-memoji.png")], ["README.md", Buffer.from("# Run the example\n\nInstall with `npm install`, then run `npm run dev` and open http://localhost:3000.\n\n" + read("docs/components/dynamic-toolbar.md").toString())], ["package.json", Buffer.from(JSON.stringify({name:"dynamic-toolbar-example",private:true,scripts:{dev:"next dev",build:"next build",start:"next start"},dependencies:pkg.dependencies,devDependencies:pkg.devDependencies},null,2))], ["tsconfig.json", read("tsconfig.json")], ["postcss.config.mjs", read("postcss.config.mjs")]);
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let bit=0;bit<8;bit++) crc=(crc>>>1) ^ (0xedb88320 & -(crc&1)); } return (crc ^ 0xffffffff)>>>0; };
const local = [], directory = []; let offset = 0;
for (const [path, content] of entries) {
 const name = Buffer.from(path); const crc=crc32(content);
 const header=Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20,4); header.writeUInt32LE(crc,14); header.writeUInt32LE(content.length,18); header.writeUInt32LE(content.length,22); header.writeUInt16LE(name.length,26);
 const central=Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6); central.writeUInt32LE(crc,16); central.writeUInt32LE(content.length,20); central.writeUInt32LE(content.length,24); central.writeUInt16LE(name.length,28); central.writeUInt32LE(offset,42);
 local.push(header,name,content); directory.push(central,name); offset+=header.length+name.length+content.length;
}
const central=Buffer.concat(directory); const end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length,8); end.writeUInt16LE(entries.length,10); end.writeUInt32LE(central.length,12); end.writeUInt32LE(offset,16);
writeFileSync(new URL("../public/r/dynamic-toolbar-example.zip",import.meta.url),Buffer.concat([...local,central,end]));
writeFileSync(new URL("../public/r/dynamic-toolbar-provenance.json",import.meta.url),JSON.stringify({source:"components/toolbar.tsx",sha256:createHash("sha256").update(read("components/toolbar.tsx")).digest("hex"),example:"/examples/dynamic-toolbar",archive:"/r/dynamic-toolbar-example.zip"},null,2)+"\n");
console.log(`Built original toolbar example (${entries.length} files)`);
