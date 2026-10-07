# Reavers OS Concept (second prototype, FRONTEND ONLY, MOCK DATA)

A reinvention of the first prototype (`../operations-prototype`): seven nouns instead of 25 modules, a persona-driven
Today page, a single Inbox of decisions, one workbench shape for every record, and "stories" instead of a social composer.
Read `/concept` inside the app for the reasoning.

Nothing outside this folder changed. No backend, Supabase, auth, OAuth, tokens, storage or social APIs.

```
npm install && npm run dev     # http://localhost:5173
npm run typecheck && npm run build
```
`src/model.ts` derives the new views (happenings, asks, people, stories, attachments) from the same mock data as prototype 1.
