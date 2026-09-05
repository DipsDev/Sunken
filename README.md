# Sunken (React + TypeScript)

A TypeScript port of the React + Vite version of `sunken.html`. Same
behavior — everything is client-side and local (no network calls, no
server), with all data in the browser's `localStorage`.

## Structure

- `src/types.ts` — shared types: `Entry` (a saved code as persisted to
  storage), `Draft` (in-progress setup), `Share`, `Grid`, `RecoverResult`
- `src/App.tsx` — top-level screen router (home / new / trainer / done / recover)
- `src/screens/` — one component per screen
- `src/components/` — small shared pieces (`GridTable`, `CopyButton`)
- `src/lib/crypto.ts` — random helpers, SHA-256 hashing, password↔bigint conversion
- `src/lib/shamir.ts` — Shamir secret sharing (split / reconstruct) over the shared prime field
- `src/lib/grid.ts` — grid-puzzle generation and the canvas-based PNG export
- `src/lib/storage.ts` — `localStorage` persistence (sync variants avoid a loading flash on mount)
- `src/style.css` — unchanged from the original inline `<style>` block

A few spots use a non-null assertion (`entry.k!`, `draft.k!`, etc.) where a
field is only optional in the type because it's conditional on `method`
('shares' | 'grid' | 'both') — the surrounding code already checks the
method before touching them, so the assertion just documents that runtime
invariant to the type checker.

## Development

```bash
npm install
npm run dev
```

## Type-checking only

```bash
npm run typecheck
```

## Production build

```bash
npm install
npm run build     # runs tsc -b, then vite build
npm run preview   # to preview the production build locally
```

The build output goes to `dist/` and is fully static — deploy it anywhere
that serves static files.
