import type { DefaultInspectorConfig } from "@/models/DataSource";
import type { InspectorDataSourceConfig } from "@/models/MapView";

/**
 * Resolve effective inspector config by merging superadmin defaults on top of
 * a per-map data source config. When the per-map config has no stored items,
 * falls back to the superadmin defaults for items, layout, icon, and color.
 *
 * Follows the same pattern as resolveColumnMetadata.
 */
export function resolveInspectorConfig(
  config: InspectorDataSourceConfig,
  defaults: DefaultInspectorConfig | null | undefined,
): InspectorDataSourceConfig {
  if (!defaults) return config;

  const hasStoredItems =
    config.inspectorItems != null && config.inspectorItems.length > 0;

  if (hasStoredItems) return config;

  return {
    ...config,
    inspectorItems: defaults.items ?? config.inspectorItems,
    layout: defaults.layout ?? config.layout,
    icon: defaults.icon ?? config.icon ?? undefined,
    color: defaults.color ?? config.color ?? undefined,
  };
}
