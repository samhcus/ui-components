# Dynamic Island Toolbar

The live example and first registry file use `components/toolbar.tsx` directly,
without a scoped fork or rewritten implementation. The supporting sources are
included at their original import paths.

## Install

```sh
npx shadcn@latest add https://ui.samhc.us/r/dynamic-toolbar.json
```

Requires a Next.js App Router project with React, Tailwind CSS 4, and the `@/`
root alias. Review the file list before installing into an existing project:
the original imports require the supplied helper paths and may overlap yours.

Mount `<Toolbar />` inside `ThemeProvider` from `next-themes` (attribute="class",
defaultTheme="light") and the supplied `TooltipProvider`. Mount the supplied
`<Toaster position="top-center" />` once. Wrap page content in `<div id="mh-page">`.
The toolbar intentionally changes the owning document and creates portals there.
It also mounts shared sound feedback for controls in that document. The speaker
button saves your sound preference; reduced motion defaults to silence unless
you explicitly enable sound. Slider detents tick only when their value changes.
Notifications follow the document’s selected font, spacing, and colour tokens.

## Fonts, styles, and assets

`styles/dynamic-toolbar-original.css` is the personal site's original stylesheet.
Merge its theme tokens, toolbar/drawing rules, and font rules into your global
Tailwind stylesheet. It also includes personal-site canvas and breakpoint rules;
review these before applying it to another site.

The reference layout in `docs/dynamic-toolbar-original-layout.tsx` shows all 14
`next/font/google` registrations and the exact CSS variable names. It is a source
reference, not a replacement root layout. Register those fonts and set
`--font-inter-locked` to the original Inter family before mounting the toolbar.

The original cat cursor uses `/oneko.png`, and notifications use
`/brand/samuel-memoji.png`. Copy those assets from the full example source download
or download them from https://ui.samhc.us/oneko.png and
https://ui.samhc.us/brand/samuel-memoji.png. Preserve the upstream oneko asset's
attribution and licensing; the memoji is Samuel's personal identity artwork.

## Isolated example

The library loads `/examples/dynamic-toolbar` in an iframe with
`sandbox="allow-scripts allow-downloads"`. It deliberately excludes
`allow-same-origin`, so the example cannot access the parent document or its
storage. Each restart creates a fresh document. No postMessage command bridge
or parent DOM mutation is used. Local storage persistence is unavailable in
this example; the unchanged toolbar already handles unavailable storage.

The full example download contains the original toolbar, dependencies, original
layout/styles, example page, and its assets. The toolbar's source bytes are
identical to the personal-site component at build time.
