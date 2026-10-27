# Contributing

## Setup

1. Fork and clone
2. Copy `.env.example` to `.env`, then open and fill it in
3. Install `bun install`
5. Start `bun dev`

## Structure

```text
src/
  app.html
  hooks.server.ts          # /app guard (fetch get-session, fail-closed)
  routes/
    +layout.svelte
    +page.svelte           # landing page
    layout.css
    login/
    app/                   # main Levelecture application
      +layout.ts           # ssr = false
      +layout.svelte       # client-side auth guard
      +page.svelte
  lib/
    auth.ts                # Better Auth client
    api/
      request.ts           # ofetch + Zod + ApiError
      assignments/
      courses/
      charts/
    types/                 # Zod schemas and types
    components/
      app/                 # feature
      auth/
      ui/
    assets/
    assignments-revision.svelte.ts
static/
```

- `$lib` is the built-in SvelteKit alias; `$components` maps to `src/lib/components`.
- Zod schemas in `src/lib/types/` are the source of truth for API payloads. Keep them in sync with the backend.

## Development patterns

- **API**: add a Zod schema in `src/lib/types/`, a module in `src/lib/api/<feature>/index.ts`, and call it through `request()` so responses are validated and errors become `ApiError`.
- **UI**: put feature components in `src/lib/components/app/<feature>/`.
- **Auth**: every page under `/app` must pass both guards: the server guard in `hooks.server.ts` and the client guard in `app/+layout.svelte`.
- **Avoid duplication**: check whether a helper, type, or component already exists before adding a new one.

## Commit

Use [Conventional Commits](https://www.conventionalcommits.org/)

Write the subject in the imperative, lowercase, no trailing period. Describe what changed.