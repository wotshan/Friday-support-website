# Friday AI Bot Platform

A premium dark AI bot command center with a public product landing page, live runtime controls, analytics, and persistent activity history.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/friday` — React/Vite public site and dashboard UI.
- `artifacts/api-server/src/routes/bot.ts` — Friday runtime summary, analytics, activity, status, and command API.
- `lib/api-spec/openapi.yaml` — source of truth for the bot API contract.
- `lib/db/src/schema/bot.ts` — persistent runtime status and activity tables.
- `artifacts/friday/src/index.css` — shared dark visual language, typography, grain, and motion tokens.

## Architecture decisions

- The browser uses generated OpenAPI React Query hooks rather than hand-written fetch wrappers.
- Bot status and activity are persisted in PostgreSQL through Drizzle so dashboard actions survive reloads.
- The landing page and dashboard share the same Friday monogram, dark palette, and motion language but have separate navigation shells.
- Analytics are represented as a stable API read model so the dashboard can later swap in real aggregates without changing the UI contract.

## Product

Friday gives teams one focused place to understand what their AI bot is doing, inspect recent activity, view request performance, change operating status, and trigger runtime actions. The public site communicates the product with a restrained dark editorial presentation instead of a generic cyber aesthetic.

## User preferences

- The user wants a high-quality minimalist dark website, not a cheap cyber-style interface.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`; generated client files are consumed by the frontend.
- The artifact workflows provide `PORT` and `BASE_PATH`; do not run the Vite app outside the managed workflow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
