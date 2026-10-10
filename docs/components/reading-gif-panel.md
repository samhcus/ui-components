# Reading GIF Panel

This is the original samhc.us GIF panel preserved before Instagram, YouTube,
and Buy Me a Coffee were removed from the homepage. All five original buttons
remain in this library version, alongside the overlapping book covers and
morphing book details and purchase links.

The panel JSX and BookCover implementation were extracted without changing
their markup, classes, or behavior. Only the wrapper and import paths needed
to expose the panel independently were added. The original SocialDock and
reading data are byte-for-byte copies. The full original ReadingSection source
is also included as `docs/reading-section-original.txt`.

## Use

```sh
npx shadcn@latest add https://ui.samhc.us/r/reading-gif-panel.json
```

```tsx
import { ReadingGifPanel } from "@/components/reading-panel/reading-gif-panel";

<ReadingGifPanel />
```

Requires Next.js App Router, React, Tailwind CSS 4, and the `@/` root alias.
Mount the supplied TooltipProvider around the panel. Supporting components
use their original import paths; review those paths before installing into an
existing project.

The complete example includes the original train GIF and book covers at their
original `/reading/` URLs, original theme/font layout and global CSS, and a
runnable page. Download it from `/r/reading-gif-panel-example.zip`, run
`npm install`, then `npm run dev`. The original stylesheet includes Samuel's
390px mobile and 1152px desktop canvases and breakpoints. Keep those when
reproducing the original layout, or merge only the needed tokens into your app.

The registry includes the original social-dock CSS directly. The full original
stylesheet is supplied separately as `styles/reading-panel-original.css`.
Assets, source hashes, and the source commit are listed in
`/r/reading-gif-panel-provenance.json`. The snapshot does not read the homepage's
edited social dock.
