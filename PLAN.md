# Fix Superadmin Data Source Config Components

## Context

The MapView `inspectorDataSourceConfigSchema` was cleaned up — the old multi-array model (`columns`, `columnOrder`, `columnItems`, `columnMetadata`, `columnGroups`, `type`) was replaced with a single `inspectorColumnItems` array. The removed types (`DefaultInspectorDataSourceConfig`, `InspectorDataSourceConfigType`, etc.) are still referenced by the superadmin components, which are now broken.

Additionally, `inspectorColumns` is being removed from DataSource (all info moves into `defaultInspectorConfig.items`), a new `defaultChoroplethConfig` field is being added, and the file-based metadata system (`MovementLibraryMeta` JSON files) is being replaced with DB-backed fields.

## Step 1: Move shared schemas to `inspectorColumn.ts`

**File**: `src/models/inspectorColumn.ts`

Move `inspectorLabelDividerSchema` and `inspectorColumnItemSchema` (+ types) from `MapView.ts` into `inspectorColumn.ts`. This avoids circular deps since both `DataSource.ts` and `MapView.ts` need to import them.

**File**: `src/models/MapView.ts`

Remove the definitions, import + re-export from `inspectorColumn.ts` so existing consumers don't break.

## Step 2: Update DataSource model

**File**: `src/models/DataSource.ts`

- Define `defaultInspectorConfigSchema`:
  - `items: z.array(inspectorColumnItemSchema).default([])`
  - `layout: z.enum(["single", "twoColumn"]).optional().nullable()`
  - `color: z.string().optional().nullable()`
  - `name: z.string().optional().nullable()`
  - `description: z.string().optional().nullable()`
  - `icon: z.string().optional().nullable()`
  - `screenshotUrl: z.string().optional().nullable()`
- Define `defaultChoroplethConfigSchema`:
  - `column: z.string()`
  - `calculationType: z.nativeEnum(CalculationType)` (import from MapView)
- Add both to `dataSourceSchema` as `.nullish()`
- Remove `inspectorColumns` from `dataSourceSchema`
- Remove `InspectorColumn` re-exports that are no longer needed on DataSource

**File**: `src/server/models/DataSource.ts`

- Remove `InspectorColumn` import and `inspectorColumns: Generated<InspectorColumn[]>` line

**File**: `src/server/services/database/schema.ts`

- Remove `inspectorColumns` from `DataSource` interface
- Add `defaultChoroplethConfig: unknown | null`

## Step 3: Database migration

**New file**: `migrations/{timestamp}_add_default_choropleth_config.ts`

- Add `defaultChoroplethConfig` JSONB column to `dataSource`
- Drop `inspectorColumns` column from `dataSource`

## Step 4: tRPC router + repository

**File**: `src/server/trpc/routers/dataSource.ts`

- Replace `defaultInspectorDataSourceConfigSchema` import with `defaultInspectorConfigSchema` from `@/models/DataSource`
- Update `updateDefaultInspectorConfig` mutation input to use new schema
- Add `updateDefaultChoroplethConfig` superadmin mutation
- Remove `inspectorColumns` from `create` procedure (line ~377) and `updateConfig` procedure (line ~419)
- Remove `inspectorColumns` from `updateOrganisationOverride` input if still present

**File**: `src/server/repositories/DataSource.ts`

- Add `updateDataSourceDefaultChoroplethConfig(id, config)` function

## Step 5: Rewrite `page.tsx`

**File**: `src/app/(private)/(dashboards)/superadmin/data-sources/[id]/page.tsx`

Remove all file-based metadata infrastructure:

- Delete `MovementLibraryMeta` import and type
- Delete the `useEffect` fetching from `/api/data-source-previews/{id}/meta`
- Delete `saveMeta` mutation, `metaToPersist` memo, `autoSaveTimeoutRef` for meta
- Delete `cacheBuster` state

New approach:

- `localInspectorConfig` state of type `DefaultInspectorConfig` — initialised from `dataSource.defaultInspectorConfig`
- `localChoroplethConfig` state of type `DefaultChoroplethConfig | null` — initialised from `dataSource.defaultChoroplethConfig`
- Two debounced auto-save effects, one for each config, using existing tRPC mutations
- `GeneralSection` takes `name/description/icon` from `localInspectorConfig` and calls an `onChange` that patches `localInspectorConfig`
- Render order: GeneralSection, ScreenshotSection, DefaultChoroplethSection, DefaultInspectorConfigSection + preview

## Step 6: Rewrite `DefaultVisualisationSection.tsx` → split into two

### `ScreenshotSection` (rename existing file or new component)

Simple component:

- Props: `screenshotUrl: string | null | undefined`, `onUploaded: (url: string) => void`
- Uses `uploadFile` from `@/services/uploads` (existing service)
- Shows current screenshot preview (from URL) or placeholder
- File input + upload button
- No more file-path display or cache-busting logic

### `DefaultChoroplethSection.tsx` (new file)

**New file**: `src/app/(private)/(dashboards)/superadmin/data-sources/[id]/components/DefaultChoroplethSection.tsx`

- Props: `dataSource: DataSource`, `config: DefaultChoroplethConfig | null`, `onChange: (config) => void`
- Select for `column` (from `dataSource.columnDefs`)
- Select for `calculationType` (Count, Sum, Avg, Mode)

## Step 7: Rewrite `DefaultInspectorConfigSection.tsx`

**Do NOT reuse** `ColumnsSection` or `inspectorColumnOrder.ts` — they're built around the old multi-array model and are themselves broken. The new model has a single `items: InspectorColumnItem[]` which is much simpler.

Props:

- `dataSource: DataSource`
- `items: InspectorColumnItem[]`
- `layout`, `color`
- `onChange: (patch: { items?, layout?, color? }) => void`

UI:

- Layout selector (single/twoColumn) — keep existing UI
- Colour selector — keep existing UI
- Column management operating directly on `items` array:
  - Available columns list (from `columnDefs`, excluding those already in `items`)
  - Selected items list (columns + dividers, drag-to-reorder)
  - Per-column settings inline: displayFormat (`ColumnDisplayFormat` enum), scaleMax, barColor, comparisonStat, hidden
  - Add/remove all buttons, add divider button
- **Note**: `displayName` and `description` UI controls for columns should be removed from this section. They should be re-implemented later writing to `columnMetadata` instead (since they are relevant to columns whenever displayed, not just the inspector).

Key operations are simple array manipulations:

- Add column: append `{ type: "column", name }` to items
- Remove column: filter out by name
- Reorder: splice array
- Add divider: append `{ type: "divider", id: uuid(), label: "" }`
- Update column setting: map over items, patch matching column

## Step 8: Rewrite `DefaultInspectorPreview.tsx`

Props change to accept `items`, `layout`, `color`, `name`, `icon`, `dataSource` directly (not an `InspectorDataSourceConfig`).

Remove `getSelectedItemsOrdered` import — `items` is already the ordered list.

Build `PropertyEntry[]` from items directly. Use `ColumnDisplayFormat` everywhere — update `PropertiesList`'s `ColumnFormat` type to use `ColumnDisplayFormat` enum instead of lowercase string literals, or at minimum ensure the preview passes `ColumnDisplayFormat` values through.

## Step 9: Delete file-based API routes

**Delete**: `src/app/api/data-source-previews/[id]/meta/route.ts`
**Delete**: `src/app/api/data-source-previews/[id]/route.ts`

## Out of scope (follow-up work)

These files also reference the old schema or the file-based metadata and need fixing separately:

- `src/app/(private)/map/[id]/components/InspectorPanel/BoundaryDataPanel.tsx` — `useEffectiveConfig` reads old-shape `defaultInspectorConfig`
- `src/app/(private)/map/[id]/components/InspectorPanel/inspectorColumnOrder.ts` — entire file operates on old schema
- `src/app/(private)/map/[id]/components/InspectorPanel/InspectorSettingsModal/ColumnsSection.tsx` — old schema
- `src/app/(private)/map/[id]/components/InspectorPanel/InspectorSettingsModal/constants.ts` — imports removed `InspectorColumnFormat`
- `src/app/(private)/map/[id]/components/Legend/Legend.tsx` — reads file-based metadata for displayMode
- `src/server/trpc/routers/map.ts` — reads movement library meta JSON file
- `src/app/(private)/(dashboards)/superadmin/page.tsx` — references `ds.defaultInspectorConfig` (still works, just the shape changes)
- Various test files referencing `inspectorColumns`

## Verification

1. `npm run lint` — must pass (no type errors from removed types/fields)
2. `npm run dev` — navigate to `/superadmin`, click Configure on a public data source
3. Verify: GeneralSection saves name/description/icon to DB (check via `trpc.dataSource.listPublic`)
4. Verify: Screenshot upload works via existing upload service, URL saved to `defaultInspectorConfig.screenshotUrl`
5. Verify: Choropleth config (column + calculationType) saves to `defaultChoroplethConfig`
6. Verify: Inspector config (columns, dividers, layout, colour) saves to `defaultInspectorConfig.items`
7. Verify: Preview reflects changes live
8. `npm run migrate` — migration runs cleanly
