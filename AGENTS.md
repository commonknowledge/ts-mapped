# Agent Guidelines

This document covers conventions and standards for writing code in this project.

## Project Overview

**Mapped** is a full-stack geospatial data visualisation platform built with:

- **Framework**: Next.js 16 (App Router), React 19
- **Database**: PostgreSQL via [Kysely](https://kysely.dev/) ORM, with PostGIS for geospatial data
- **API layer**: [tRPC](https://trpc.io/) v11 with React Query v5
- **Styling**: TailwindCSS v4, [shadcn/ui](https://ui.shadcn.com/) components (in `src/shadcn/ui/`) — use these, never import from Radix UI directly
- **Maps**: Mapbox GL, React Map GL
- **Testing**: Vitest
- **Language**: TypeScript (strict)

## Commands

```bash
# Lint (prettier + eslint --fix + tsc --noEmit + circular dep check, all in parallel)
npm run lint

# Run tests — only run relevant tests; the full suite is slow and requires external services
npm test -- run [vitest_args]

# Examples:
npm test -- run tests/unit/server/repositories/DataRecord.test.ts
npm test -- run -t "listReadable"

# Dev server
npm run dev

# Database migrations
npm run migrate
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/             # Login, invitation flows
│   ├── (marketing)/        # Public marketing site
│   ├── (private)/          # Authenticated app
│   │   ├── (dashboards)/   # Dashboard pages
│   │   └── map/            # Map editor
│   ├── api/                # REST API routes (streaming, bulk data)
│   └── public/             # Public map viewer
├── components/             # Shared React components
├── hooks/                  # Shared React hooks
├── models/                 # Zod schemas and TypeScript types (client + server safe)
├── providers/              # React context providers
├── server/                 # Server-only code
│   ├── adaptors/           # Data source integrations (Airtable, Google Sheets, etc.)
│   ├── jobs/               # Background job handlers
│   ├── models/             # Kysely DB table types (Generated, Insertable, etc.)
│   ├── repositories/       # All database queries
│   ├── services/           # Singleton services (database, queue, redis, etc.)
│   └── trpc/               # tRPC router definitions
├── services/               # Client-side services (tRPC client, query client)
└── types.ts                # Frontend-specific TypeScript types
```

Path alias: `@/*` maps to `src/*`.

## Client vs Server Components

**Never import from `@/server/*` in client components** (files with `"use client"`). Doing so will cause build errors because server-only modules (database drivers, node APIs, etc.) cannot run in the browser.

Even in server components, prefer importing types from `@/models/` rather than `@/server/models/`, since `@/models/` is safe to use anywhere.

```tsx
// ✅ Good — safe anywhere
import type { DataSource } from "@/models/DataSource";

// ❌ Bad in client components
import type { DataSource } from "@/server/models/DataSource";
```

Use tRPC as the bridge between client components and server logic:

- **Client components**: call `useQuery(trpc.router.procedure.queryOptions())` / `useMutation(trpc.router.procedure.mutationOptions())`
- **Server components**: call the server-side tRPC caller from `src/services/trpc/server.tsx`
- **API routes**: use for streaming responses or bulk data that would be impractical over tRPC

## Database

### Kysely ORM

All database access belongs in `src/server/repositories/`. Build queries with Kysely's query builder; avoid raw SQL (`sql` template tag) unless there is no alternative.

### JSONPlugin

The database is configured with a custom `JSONPlugin` that automatically serialises JavaScript objects and arrays into JSONB when writing to the database. **Do not call `JSON.stringify()` on values passed to Kysely queries** — it's handled for you and double-encoding will corrupt the data.

```ts
// ✅ Correct — pass the object directly
await db.insertInto("dataSource").values({ config: { type: "csv", ... } }).execute();

// ❌ Wrong — JSONPlugin already handles this
await db.insertInto("dataSource").values({ config: JSON.stringify({ type: "csv", ... }) }).execute();
```

`JSON.stringify()` is only appropriate inside raw SQL strings (which should themselves be avoided where possible).

### PointPlugin

The `PointPlugin` handles serialisation of PostGIS geometry/geography columns:

- **Writing**: pass `{ lat: number, lng: number }` and the plugin converts it to `SRID=4326;POINT(lng lat)` WKT automatically. The same applies to `Polygon` and `MultiPolygon` GeoJSON objects.
- **Reading**: WKB hex strings returned by PostGIS are automatically parsed back to `{ lat, lng }` (or GeoJSON Polygon/MultiPolygon).

If a new PostGIS geometry column does not appear to be working (values come back as raw hex strings, or writes fail silently), check whether the column name/type is covered by the plugin's detection logic in `src/server/services/database/plugins/PointPlugin.ts`.

## tRPC

Routers live in `src/server/trpc/routers/`. The procedure hierarchy is:

| Procedure                                | Requires                            |
| ---------------------------------------- | ----------------------------------- |
| `publicProcedure`                        | Nothing                             |
| `protectedProcedure`                     | Authenticated user                  |
| `organisationProcedure`                  | User + valid `organisationId` input |
| `dataSourceReadProcedure`                | Read access to a data source        |
| `dataSourceOwnerProcedure`               | Ownership of a data source          |
| `mapReadProcedure` / `mapWriteProcedure` | Map-level access                    |
| `superadminProcedure`                    | Admin email                         |

Use the most restrictive procedure appropriate for the operation. `organisationProcedure` automatically validates org membership and injects `ctx.organisation`.

Client-side types are inferred automatically:

```ts
import type { RouterInputs, RouterOutputs } from "@/services/trpc/react";
```

## State Management

### Server state (React Query)

The query client is configured with `staleTime: Infinity`. Cached data will not be automatically refetched — you must invalidate the relevant query key after mutations:

```ts
useMutation(
  trpc.map.update.mutationOptions({
    onSuccess: () => queryClient.invalidateQueries(trpc.map.list.queryFilter()),
  }),
);
```

### Client state (Jotai)

Jotai atoms are used for local/UI state, particularly in the map editor. **Never read or write atoms directly inside components.** Always create a named hook in a `hooks/` directory:

```ts
// src/hooks/useCurrentUser.ts
export function useCurrentUser() {
  return useAtomValue(currentUserAtom);
}
```

Global atoms (current user, organisation) are hydrated from the server via providers in `src/providers/`.

## Imports & Code Style

ESLint enforces these rules automatically (run `npm run lint` to fix):

- **Import order**: builtin → external → internal (`@/`) → parent (`../`) → sibling (`./`), each group alphabetised
- **Type imports**: use `import type` for type-only imports
- **No unused imports**: remove them or the lint step will fail
- **No circular dependencies**: checked by `madge`; avoid import cycles between modules

## Testing

Tests use Vitest. The full test suite starts ngrok, pg-boss, and a webhook server, and reads from `test_credentials.json` — it is slow and has external dependencies. **Only run the tests relevant to your change.**

```bash
# Run a single test file
npm test -- tests/unit/server/repositories/DataRecord.test.ts

# Run tests matching a name pattern
npm test -- -t "geocode"

# Run all unit tests (faster than the full suite)
npm test -- tests/unit
```

Integration tests in `tests/feature/` hit a real database and external services. Unit tests in `tests/unit/` are faster and self-contained.
