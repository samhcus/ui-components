// Builds the self-hosted shadcn registry: reads registry.json, inlines each
// referenced file's contents, and writes public/r/<name>.json in shadcn
// registry-item format. Zero dependencies, so it runs identically in a git
// worktree, CI, and the deploy step (this repo's pnpm store does not extend
// into worktrees, which breaks the shadcn/Turbopack CLIs). Regenerate with:
//   pnpm registry:build

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));

const outDir = join(root, "public", "r");
mkdirSync(outDir, { recursive: true });

const index = [];

for (const item of registry.items) {
  const files = item.files.map((file) => ({
    ...file,
    content: readFileSync(join(root, file.path), "utf8"),
  }));

  const out = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    ...(item.title && { title: item.title }),
    ...(item.description && { description: item.description }),
    ...(item.author && { author: item.author }),
    ...(item.dependencies && { dependencies: item.dependencies }),
    ...(item.devDependencies && { devDependencies: item.devDependencies }),
    ...(item.registryDependencies && {
      registryDependencies: item.registryDependencies,
    }),
    ...(item.cssVars && { cssVars: item.cssVars }),
    ...(item.css && { css: item.css }),
    files,
  };

  writeFileSync(
    join(outDir, `${item.name}.json`),
    JSON.stringify(out, null, 2) + "\n"
  );

  index.push({
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
  });
}

writeFileSync(
  join(outDir, "registry.json"),
  JSON.stringify(
    { name: registry.name, homepage: registry.homepage, items: index },
    null,
    2
  ) + "\n"
);

console.log(`Built ${registry.items.length} registry items → public/r/`);

await import("./build-toolbar-example.mjs");
await import("./build-reading-panel-example.mjs");
