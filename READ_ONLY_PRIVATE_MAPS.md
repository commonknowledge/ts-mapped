# Read-only Private Maps

## Summary

Allow users to share a private map, exactly as it is configured, with a small audience
outside their organisation via a link, optionally protected by a password.

This is distinct from **Public Maps**, which are campaign-facing sites for providing
geographical information to the general public. Read-only shares are for showing
statistics and analysis to a much smaller, trusted audience — the private map view
with no control panels: just the legend, the boundary hover info, and the inspector
with no settings buttons.

## Decisions (agreed 2026-08-05)

| Question         | Decision                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Entry UX         | New **Share button + dialog** in the navbar; rename the existing mode toggle from "Explore \| Share" to **"Explore \| Publish"**           |
| Share scope      | **Whole map, all views** — one link per map, recipients can switch between views                                                           |
| Visible controls | Legend, boundary hover info, settings-free inspector, **plus** zoom control, map style selector, timeline control, and the area search box |
| Gating           | New organisation feature flag, e.g. `Feature.SharedMaps`                                                                                   |

## UX design

### Navbar (map editor)

```
┌────────────────────────────────────────────────────────────┐
│ ‹ Maps / Map name   [views]   [Explore | Publish]  [⤴ Share] │
└────────────────────────────────────────────────────────────┘
```

- `MapModeToggle` (`src/components/MapModeToggle.tsx`) is relabelled
  **Explore | Publish**. Behaviour is unchanged (`?mode=publish` URL param); only the
  "Share" label changes, freeing the word "share" for the new feature. Audit other
  user-facing copy that calls publishing "share".
- A new **Share button** sits next to the toggle in `PrivateMapNavbar`
  (`src/app/(private)/map/[id]/components/PrivateMapNavbar.tsx`), gated on
  `Feature.SharedMaps`. It opens a popover/dialog (shadcn `Popover` or `Dialog`).

### Share dialog

```
┌───────────────────────────────────┐
│ Share this map                    │
│                                   │
│ Read-only link              [●]   │  ← switch: enable/disable
│ Anyone with the link can view     │
│ this map, but not edit it.        │
│                                   │
│ ☑ Require a password              │
│ [••••••••••]              [Set]   │
│                                   │
│ [https://…/share/aB3xY…] [Copy]   │
│                          [Reset]  │  ← regenerate link (revokes old one)
└───────────────────────────────────┘
```

- Enabling the link creates (or re-enables) the share and shows the URL immediately.
- The password is optional and set separately; it can be changed or removed at any
  time. Changing it forces existing viewers to re-enter it (see grant cookie below).
- "Reset link" regenerates the token, invalidating the old URL — the escape hatch if
  a link leaks.
- Viewers always see the **live current state** of the map, not a snapshot. The
  dialog copy should say so.

### Viewer experience (`/share/[token]`)

A slim, chrome-free version of the private map view:

```
┌────────────────────────────────────────────────────────────┐
│ Map name              [view switcher]        [search box]  │  ← ReadOnlyNavbar
├────────────────────────────────────────────────────────────┤
│ [Boundary hover info] [Inspector]                          │
│                                                            │
│                        (map)                    [style]    │
│                                                 [zoom +/-] │
│ [Legend]                              [timeline control]   │
└────────────────────────────────────────────────────────────┘
```

- No control panel, no visualisation panel, no marker settings, no table, no draw/pin
  modes.
- View switching works (client-side URL state, as in the editor).
- If the share has a password and the visitor has no valid grant, the page renders a
  centred password form instead of the map.
- If the share is disabled or the token is unknown: `notFound()`.

## Data model

New table `map_share` (one share per map):

```
map_share
  id            uuid pk default gen_random_uuid()
  map_id        uuid fk → map(id) on delete cascade, UNIQUE
  token         text UNIQUE          -- unguessable URL slug, e.g. 24-char nanoid
  enabled       boolean default true
  password_hash text null            -- scrypt "salt:hex", null = no password
  password_updated_at timestamptz null
  created_at    timestamptz default now()
```

Notes:

- `passwordHash` as the column/property name means the existing
  `hasPasswordHashSerializer` (`src/utils/superjson.ts`, registered in
  `src/server/trpc/index.ts:33`) automatically strips it from every tRPC response.
- Reuse `hashPassword` / `verifyPassword` from `src/server/utils/auth.ts:36-61`.
- `password_updated_at` lets us invalidate existing viewer grants when the password
  changes (grant issued-at < password_updated_at ⇒ re-prompt).
- Disabling keeps the row (and token) so re-enabling restores the same link;
  "Reset link" rotates `token`.
- Migration follows the existing pattern in `migrations/`.

Repository: `src/server/repositories/MapShare.ts` — `findByToken`, `findByMapId`,
`upsertForMap`, `setPassword`, `regenerateToken`, `setEnabled`.

## Access control

### The grant cookie

Anonymous viewers authenticate to shared maps via an httpOnly cookie
(`SharedMaps`), a `jose`-signed JWT (same `JWT_SECRET` infra as `src/auth/jwt.ts`)
containing a list of grants:

```ts
{ grants: [{ shareId: string, mapId: string, iat: number }], exp: ... }
```

- Visiting `/share/[token]` for a **passwordless** share: the server component sets
  the grant cookie directly and renders the map.
- For a **password-protected** share: the page renders the password form; a route
  handler (`POST /api/share/[token]/verify`) checks the password with
  `verifyPassword`, rate-limited via the existing Redis rate limiter
  (`src/server/services/ratelimit.ts`, same 5-attempts/15-min pattern as login,
  keyed on IP + token), and sets the grant cookie on success.
- Grants cap at a handful of entries (drop oldest) and expire (e.g. 7 days).
- **The cookie is necessary but not sufficient**: every server-side check re-fetches
  the `mapShare` row and verifies `enabled`, and, if `passwordHash` is set, that
  `grant.iat >= passwordUpdatedAt`. Disabling a share or changing the password
  revokes access immediately.

### Choke points (all three must change)

Exploration confirmed exactly three places gate anonymous read access today, each
currently keyed on "a published public map exists":

1. **`mapReadProcedure`** (`src/server/trpc/index.ts:199-234`) — add a branch: if no
   user/org access, check the grant cookie for a valid grant matching `input.mapId`
   (with the enabled/password-freshness re-check above). This unlocks `map.byId`,
   `dataSource.listForMapView`, and `mapView.inspectorConfigs` for viewers.
   `createContext` (`:20-28`) must start reading the request cookies to expose the
   parsed grants on `ctx`.
2. **`canReadDataSource`** (`src/server/utils/auth.ts:11-34`) — add a branch: the
   data source is visualised by a map for which the caller holds a valid grant
   (analogous to `findPublishedPublicMapByDataSourceId` in
   `src/server/repositories/PublicMap.ts:56-92`, but checking across **all views**
   of the shared map plus `mapConfig.markerDataSourceIds`). This unlocks
   `area.stats`, `dataRecord.byId/byAreaCode/byPoint/list/columnStat`.
3. **Markers REST route** (`src/app/api/data-sources/[id]/markers/route.ts`) — reads
   the session and calls `canReadDataSource` independently; pass the parsed grants
   through the same helper.

Additionally:

- **`area.search` / `area.byCode`** are `protectedProcedure` today and the search box
  and boundary markers need them. Rather than making them fully public, introduce a
  new procedure tier, e.g. **`viewerProcedure`**: allows the request through if there
  is an authenticated user **or** the grant cookie contains at least one valid grant
  (re-checked against the `mapShare` row: `enabled`, password freshness — same
  validation as the other choke points, factored into a shared helper). Ctx becomes
  `{ user: User | null, shareGrants: ValidatedGrant[] }`. Move `area.search` and
  `area.byCode` onto it. Anonymous visitors with no grant still get `UNAUTHORIZED`,
  so boundary search is never open to the public internet. Note these procedures
  must not assume `ctx.user` exists (area lookups are not user-scoped, so this
  should be a no-op — verify).

### tRPC router

New `mapShare` router (`src/server/trpc/routers/mapShare.ts`), all under
`mapWriteProcedure` (org members who can edit the map manage sharing):

- `get({ mapId })` — current share state (token, enabled, `hasPassword` boolean —
  never the hash, which the serializer strips anyway).
- `enable({ mapId })` / `disable({ mapId })` — creates the row on first enable.
- `setPassword({ mapId, password: string | null })` — hash + set `passwordUpdatedAt`.
- `regenerateToken({ mapId })`.

One `publicProcedure`: `mapShare.getPublicInfo({ token })` — returns
`{ mapId, mapName, requiresPassword }` or null, for the share page shell / password
form. (Alternatively do this fully server-side in the page; no tRPC needed.)

## Client implementation

### Route

`src/app/share/[token]/page.tsx` — **outside `(private)`** (whose layout redirects
unauthenticated visitors to login, `src/app/(private)/layout.tsx:16-19`). Server
component:

1. Look up the share by token; `notFound()` if missing/disabled.
2. If password required and no valid grant cookie → render `SharePasswordForm`.
3. Else set/refresh the grant cookie and render the map shell:

```
MapJotaiProvider mapId viewId readOnly
├ SharedMap → Map                    (existing components)
├ ReadOnlyNavbar                     (new: name, view switcher, SearchBox)
└ ReadOnlyMapControls                (new: fork of PrivateMapControls)
  ├ BoundaryHoverInfo                (as-is — client-only state, safe)
  ├ InspectorPanel readOnly
  ├ LegendDisplay                    (new: display-only legend overlay)
  ├ MapStyleSelector / ZoomControl / TimelineControl
  └ MapInfoPopup                     (already has a ReadOnlyContent renderer)
```

Set `X-Robots-Tag: noindex` on this route.

### Read-only state

Follow the `isPublicMapRouteAtom` precedent (`atoms/mapStateAtoms.ts:14` and
`useEditable()` in `publish/hooks/usePublicMap.ts:39-45`):

- Add `isReadOnlyRouteAtom`, hydrated by `MapJotaiProvider`
  (`src/providers/MapJotaiProvider.tsx`) via a new `readOnly` prop.
- Add a hook (e.g. `useMapEditable()`) consumed by the components below rather than
  prop-drilling.

### Component work

- **Legend** (`map/[id]/components/Legend/Legend.tsx`) is currently mounted _inside_
  the control panel (`controls/BoundariesControl/BoundariesControl.tsx:57`) and is
  ~90% editing UI; only the `LegendBars` / `BivariateLegend` section (lines ~440-457)
  is pure display. Extract a **`LegendDisplay`** component (colour bars + column/
  boundary labels, plus `MarkerLegend`'s display part) that both the existing Legend
  and the read-only overlay use. Do not fork the bars themselves.
- **InspectorPanel** (`map/[id]/components/InspectorPanel/InspectorPanel.tsx`): under
  read-only, hide:
  - "Add to areas" (`:368-375`, writes via `trpc.turf.upsert`)
  - "View in table" (`:397-405`, no table in this view)
  - the config gear (`InspectorDataTab.tsx:88-90, :246-248, :320`,
    `ConfigurableDataRecordsPanel.tsx:21-38`, `InspectorConfigItem.tsx:98`)
  - Notes tab (already self-gates on `useOrganisationId()`, which is null for
    anonymous viewers — verify, don't assume)
  - Keep: Compare, minimise/back, fly-to (client-only state).
- **ReadOnlyMapControls**: fork of `PrivateMapControls.tsx:83-119` keeping
  `BoundaryHoverInfo`, `InspectorPanel`, `MapStyleSelector`, `ZoomControl`,
  `TimelineControl`; dropping the draw/pin-drop banner (`:121-146`).
- **ReadOnlyNavbar**: new slim navbar. Do **not** mount `MapNavbar` — it runs
  `useInitialMapViewEffect()` which _writes_ views if none exist
  (`hooks/useInitialMapView.ts`), and `PrivateMapNavbar` auto-uploads thumbnails via
  `trpc.map.update` (`PrivateMapNavbar.tsx:112-138`). The view switcher needs a
  read-only variant of `MapViews` (list/switch only; no create/rename/delete).
- **Data hooks**: `useDataSources` (`src/hooks/useDataSources.ts:42-53`) branches on
  `isPublicMapRouteAtom` to call `dataSource.listForMapView` instead of the
  `protectedProcedure` `listReadable`; extend the branch to include the read-only
  route. Similarly audit `useMarkerQueries` (`hooks/useMarkerQueries.ts`): in
  read-only mode it must use the **full private** `mapConfig.markerDataSourceIds`
  (not the public-map subset), with the markers REST call authorised by the grant
  cookie.
- **Share dialog**: new `ShareMapDialog` component under
  `map/[id]/components/`, driven by the `mapShare` router, mounted from
  `PrivateMapNavbar` behind `Feature.SharedMaps`.

### Feature flag

Add `SharedMaps` to `Feature` in `src/models/Organisation.ts` and gate the Share
button the same way `Feature.PublicMaps` gates the mode toggle
(`PrivateMapNavbar.tsx:37-41`). The `/share/[token]` route itself is **not** flag
-gated (existing links keep working if a flag is later toggled off — or decide the
opposite; see open questions).

## Security considerations

- **Token entropy**: ≥ 128 bits (e.g. 24-char nanoid). The URL itself is a secret
  for passwordless shares.
- **Password attempts**: rate-limited per IP + token via the existing Redis limiter.
- **Immediate revocation**: server re-checks the `mapShare` row on every request;
  the cookie alone grants nothing.
- **Password rotation invalidates grants** via `passwordUpdatedAt`.
- **No hash leakage**: `passwordHash` naming + existing superjson serializer.
- **Cookie**: httpOnly, `SameSite=Lax`, `Secure` in production.
- **Scope creep check**: `mapReadProcedure`'s public-map branch grants access when
  _any_ published public map exists for the mapId, regardless of view — the new
  share branch is map-scoped by design (whole-map sharing), but keep the grant
  checks strict (`enabled`, password freshness) since this exposes _all_ views and
  data sources visualised on the map, which is broader than a public map exposes.
- **No indexing**: `noindex` header on the share route; don't include shared maps in
  sitemaps.
- **CSP**: default `frame-ancestors 'self'` applies (the relaxed policy in
  `src/proxy.ts:27-30` is only for the public-map host rewrite) — shared maps are
  not embeddable, which is fine for this audience.

## Implementation plan — staged task sequence

Stages run in order; each ends at a checkpoint where the work is testable (automated
tests, or a manual check by the developer). Tasks within a stage are roughly ordered
but can interleave.

### Stage 1 — Schema & repository

1. **Migration**: create `map_share` table (columns as per Data model section),
   following the existing `migrations/` pattern (raw SQL = snake_case).
2. **Models**: `src/server/models/MapShare.ts` (Kysely table type, added to the
   `Database` interface in `src/server/services/database/index.ts`) and
   `src/models/MapShare.ts` (Zod schema / client-safe types).
3. **Repository**: `src/server/repositories/MapShare.ts` — `findByToken`,
   `findByMapId`, `upsertForMap`, `setPassword`, `regenerateToken`, `setEnabled` —
   with unit tests. Token generation: ≥128-bit URL-safe random.

**Checkpoint**: `npm run migrate` succeeds; repository unit tests pass.

### Stage 2 — Share management API

4. **`mapShare` tRPC router** (`src/server/trpc/routers/mapShare.ts`), all under
   `mapWriteProcedure`: `get` (returns token/enabled/`hasPassword`, never the hash),
   `enable`, `disable`, `setPassword` (hash + bump `passwordUpdatedAt`),
   `regenerateToken`. Tests: org member can manage; non-member cannot; hash never
   appears in output.

**Checkpoint**: router tests pass; a share row can be created end-to-end via tests.

### Stage 3 — Grant cookie & access control

5. **Grant cookie helpers** in `src/auth/`: issue/parse/verify a signed `SharedMaps`
   JWT holding `{ grants: [{ shareId, mapId, iat }] }`; append-with-cap, expiry.
6. **Validation helper**: given parsed grants + a mapId (or share row), decide
   validity — `enabled`, and `grant.iat >= passwordUpdatedAt` when a password is
   set. Single shared implementation used by every gate below.
7. **`createContext`** (`src/server/trpc/index.ts`): read request cookies, expose
   parsed grants on ctx.
8. **`mapReadProcedure` branch**: valid grant for `input.mapId` ⇒ allow. Tests:
   grant works, disabled share 401s, stale-password grant 401s.
9. **`canReadDataSource` branch** + new repository query "data source is visualised
   on this shared map" (across all views + `mapConfig.markerDataSourceIds`). Tests
   include the negative case: a grant for map A does **not** unlock a data source
   only on map B.
10. **Markers REST route** (`src/app/api/data-sources/[id]/markers/route.ts`): pass
    parsed grants into the same check.
11. **`viewerProcedure`** (user OR ≥1 valid grant); move `area.search` /
    `area.byCode` onto it; verify they don't assume `ctx.user`. Tests: grant-holder
    passes, bare anonymous gets `UNAUTHORIZED`, logged-in user unaffected.

**Checkpoint**: with a share row and a hand-issued cookie, all read procedures
succeed anonymously in tests; without the cookie they 401 as before.

### Stage 4 — Viewer route (passwordless shares)

12. **`/share/[token]` page** (`src/app/share/[token]/page.tsx`, outside
    `(private)`): resolve token, `notFound()` if missing/disabled, issue grant
    cookie, render map shell; `X-Robots-Tag: noindex`.
13. **Read-only state**: `isReadOnlyRouteAtom`, `readOnly` prop on
    `MapJotaiProvider`, `useMapEditable()` hook.
14. **`ReadOnlyMapControls`**: fork of `PrivateMapControls` keeping
    `BoundaryHoverInfo`, `InspectorPanel`, `MapStyleSelector`, `ZoomControl`,
    `TimelineControl`; no draw/pin banner.
15. **`ReadOnlyNavbar`**: map name, read-only view switcher (list/switch only),
    `SearchBox`. Must not mount `MapNavbar`/`PrivateMapNavbar` (hidden writes:
    initial-view creation, thumbnail upload).
16. **`LegendDisplay`**: extract the display-only legend (colour bars + labels +
    marker legend) from `Legend.tsx` / `MarkerLegend.tsx`; reuse in both places.
17. **`InspectorPanel` read-only mode**: hide config gear, "Add to areas",
    "View in table", Notes tab; keep Compare/minimise/fly-to.
18. **Data-hook branches**: `useDataSources` → `listForMapView` on the read-only
    route; `useMarkerQueries` → full private `markerDataSourceIds` with the markers
    stream authorised by the grant cookie.

**Checkpoint (manual)**: enable a passwordless share via the router, open the link
logged out — map renders read-only with legend, hover info, inspector, zoom, style,
timeline, search; view switching works; no write requests fire (check network tab).

### Stage 5 — Password gate

19. **Password form + verify endpoint**: `SharePasswordForm` rendered by the share
    page when required; `POST /api/share/[token]/verify` using `verifyPassword`,
    Redis rate limiting (5 / 15 min per IP + token), sets grant cookie on success.
20. **Invalidation behaviour**: changing/removing the password mid-session
    re-prompts existing viewers (via `passwordUpdatedAt`); tests.

**Checkpoint (manual)**: set a password, open link in incognito — form appears,
wrong password rejected (and rate-limited), correct password shows the map; change
the password and confirm the open session is booted back to the form.

### Stage 6 — Share dialog & polish

21. **Feature flag**: add `SharedMaps` to `Feature` in `src/models/Organisation.ts`.
22. **`ShareMapDialog`** + Share button in `PrivateMapNavbar` behind the flag:
    enable switch, password set/change/remove, copy link, reset link.
23. **Toggle rename**: `MapModeToggle` "Share" → "Publish"; audit remaining copy
    that calls publishing "share".

**Checkpoint (manual)**: full end-to-end flow from the dialog — enable, set
password, copy link, share, reset link invalidates the old URL.

## Open questions

1. If `Feature.SharedMaps` is later disabled for an org, should existing share links
   stop working? (Current plan: links keep working; the org just loses the UI to
   manage them.)
2. Should shares support an optional expiry date? (Not in v1; the schema doesn't
   preclude adding `expires_at` later.)
3. Should the map's owner see any indication on the dashboard map cards that a map
   is shared? (Nice-to-have, not in v1.)
