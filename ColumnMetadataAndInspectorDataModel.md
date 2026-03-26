# Column Metadata & Inspector Data Model

## DataSource

### Column information

`columnDefs` — core column type definitions, derived from import. Cannot be modified by the user as this will break visualisations (e.g. if a user says a column is a number when it contains non-numeric values, this will break the choropleth).

`columnMetadata` — extra column info, automatically set with best guess on first import, then controlled by the user.

- `description`
- `semanticType` — right now just has `Auto`, `Percentage01` and `Percentage0100` so we know if the data is a % from 0-1 or a % from 0-100 without having to guess from the data
- `valueLabels` — a way for the user to override what a value is displayed as, e.g. "0" => "Not in cluster"
- `valueColors` — default category colours for the column

**The key thing to keep in mind** is that `columnMetadata` should be used when the information is relevant to a column _whenever it is used or displayed_, and inspector-specific settings (like `displayFormat`) belong inside `defaultInspectorConfig.items`.

### Default inspector config

`defaultInspectorConfig` — superadmin-configured template that controls how this data source appears in the inspector panel when added to a map. Stored as JSONB. Contains:

- `items` — ordered array of inspector column items and label dividers. Each column item has `type: "column"` plus inspector-specific settings (`displayFormat`, `scaleMax`, `barColor`, `comparisonStat`, `hidden`); each divider has `type: "divider"`, `id`, and `label`. This is the single source of truth for which columns are shown in the inspector, in what order, with what display settings, and with optional section dividers.
- `layout` — `"single"` or `"twoColumn"` grid layout
- `color` — panel colour (Tailwind colour token, e.g. "blue")
- `name` — display name override (shown in inspector panel header)
- `description` — short description (shown in the movement data library)
- `icon` — Lucide icon name
- `screenshotUrl` — URL of the preview screenshot, uploaded via the existing upload service (`/api/upload`)

### Default choropleth config

`defaultChoroplethConfig` — default choropleth settings applied when this data source is first added to a map. Stored as JSONB. Contains:

- `column` — which column to visualise by default
- `calculationType` — `"Count"`, `"Sum"`, `"Avg"`, or `"Mode"` — the default calculation type

## DataSourceOrganisationOverride

- Contains `columnMetadata` from above but allows other organisations to override the default values.
- `defaultInspectorConfig` left out for now as non-owners cannot yet change this.

## MapView

`colorMappings` — overrides the `valueColors` for data source columns. Keyed by value, maps to colour hex strings.

`inspectorConfig` — defines which data sources should be displayed in the InspectorPanel, and what data should be displayed. Contains a `dataSources` array where each entry is an `InspectorDataSourceConfig`:

- `id` — unique identifier for this entry
- `dataSourceId` — which data source this configures
- `name` — display name (initially copied from `defaultInspectorConfig.name`)
- `inspectorColumnItems` — ordered column items and dividers (initially copied from `defaultInspectorConfig.items`)
- `layout`, `icon`, `color` — presentation settings (initially copied from defaults)

When a data source is added to a map, its `defaultInspectorConfig` is copied as the starting point for the per-map `InspectorDataSourceConfig`. Users can then modify columns, ordering, layout, and styling per-map without affecting the defaults.
