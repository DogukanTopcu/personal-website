# Darkroom

The second design of the public site: a dark cinematic screening. Same routes,
same Supabase data and the same admin panel as `../web` (Draft to Ink); only the
design differs. See the root `README.md` for setup and for how to keep one of
the two.

```bash
pnpm dev        # http://localhost:3102
pnpm build
```

## Where things are

- `src/app/page.tsx` and `src/home/`: the home page, six scenes on the
  scroll-craft engine. `DevelopPrint.tsx` is the darkroom's WebGL develop
  shader; `EngineMount.tsx` picks the clip and mounts the engine.
- `public/vendor/scrollcraft.js` and `src/vendor/scrollcraft.css`: the engine,
  unmodified. Themed through the `--sc-*` tokens in `src/app/globals.css`.
- `public/film/`: the projector clip (desktop and portrait, encoded with dense
  keyframes for scrubbing), its posters, and the stand-in print.
- `src/app/globals.css`: the design system. `src/app/(site)/sections.css`:
  section layouts for the inner pages.
- `src/lib/`: the data layer, identical to the first site's.

The brief, the verification record and the screenshots are in
`../scrollcraft/builds/darkroom/`; the design tokens in
`../design/design-dna-darkroom.json`.
