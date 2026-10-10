# Samuel’s UI Components

Open-source React components, motion primitives, assets, and complete examples.

Browse the live library at [ui.samhc.us](https://ui.samhc.us). Every catalog item has an interactive preview, source, dependencies, and a downloadable registry entry.

## Install a component

The registry works with the shadcn CLI:

```bash
pnpm dlx shadcn@latest add https://ui.samhc.us/r/pill-toggle.json
```

Replace `pill-toggle` with any item from [`registry.json`](./registry.json). The generated files are in [`public/r`](./public/r), so the registry can also be self-hosted.

## Run the library locally

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The site uses the same root routes as the public domain:

- `/` — components and live previews
- `/assets` — reusable marks, wordmarks, gradients, and sound feedback
- `/notes` — implementation notes
- `/r/<name>.json` — shadcn registry items

## Build and verify

```bash
pnpm typecheck
pnpm lint
pnpm build
```

`pnpm build` regenerates the registry JSON and the downloadable example archives before the Next.js build. The toolbar example is loaded from the production toolbar source in an opaque sandboxed iframe so its effects stay inside the example.

## Project layout

- `app/` — library pages and isolated examples
- `components/components/` — catalog gallery, previews, and source drawer
- `components/library/` — library shell, navigation, asset previews, and example window
- `registry/samuel/` — installable component source
- `public/r/` — generated registry items and example archives
- `scripts/` — registry and archive generation
- `tests/` — browser acceptance checks

## Contributing

Keep previews interactive, keep descriptions concrete, and preserve reduced-motion and keyboard behavior. When a component needs support files or assets, add them to the registry item and verify the generated download before opening a pull request.

## License

MIT. See [`LICENSE`](./LICENSE).
