# Reavers Operations Prototype (FRONTEND ONLY, MOCK DATA)

A clickable concept for running the Red Deer Reavers nonprofit from one system. Isolated from the live static website:
nothing outside this folder was changed.

- **No backend.** No Supabase tables/migrations/RLS/functions, no auth changes, no Google/Gmail/Discord, no social APIs or OAuth, no tokens, no storage.
- All data is in `src/data/*` and lives in memory (`src/services/store.ts`); refresh resets it. "Reset mock data" is in Settings.

## Run
```
cd operations-prototype
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # static output in dist/ (relative paths, hash routing, works from any folder)
```

## Structure
- `src/types` entity types · `src/data` interconnected mock data · `src/services` mock services (swap for Supabase/APIs later)
- `src/services/social` `socialService` + per-platform adapters (`facebookAdapter`, `instagramAdapter`, `tiktokAdapter`, `youtubeAdapter`, `xAdapter`) with different capabilities/metrics
- `src/components` UI kit, layout, create-form registry · `src/pages` one file per module · `src/utils` helpers, nav/roles, record links
