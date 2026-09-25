import type { MapConfig } from "@/models/Map";
import type { MapView } from "@/models/MapView";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";

export const getMarkerDataSourceIds = (mapConfig: MapConfig) => {
  return Array.from(
    new Set(
      [mapConfig.membersDataSourceId]
        .concat(mapConfig.markerDataSourceIds)
        .filter(Boolean),
    ),
  );
};

/**
 * Returns the intersection of marker data source IDs (from mapConfig) and
 * the data source IDs that have a config entry in the public map.
 *
 * This is the canonical list of data sources visible on a public map:
 * a data source must be configured in both the private mapConfig AND the
 * public map's dataSourceConfigs to be shown.
 *
 * The order of `dataSourceConfigs` is the order the data sources appear
 * in on the public map (e.g. the sidebar pills), and is user-editable
 * from the public map editor.
 */
export function getPublicDataSourceIds(
  mapConfig: MapConfig,
  dataSourceConfigs: PublicMapDataSourceConfig[],
): string[] {
  const markerIds = new Set(getMarkerDataSourceIds(mapConfig));
  const ids: string[] = [];
  for (const config of dataSourceConfigs) {
    const id = config.dataSourceId;
    if (markerIds.has(id) && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Extracts all unique data source IDs referenced in a map's config and its views.
 * Currently used to filter the data sources fetched by public maps.
 *
 * Sources:
 * - mapConfig.markerDataSourceIds
 * - mapConfig.membersDataSourceId
 * - view.config.areaDataSourceId
 */
export function getVisualisedDataSourceIds(
  mapConfig: MapConfig,
  view: MapView,
): string[] {
  const ids = new Set<string>();

  // From map config
  for (const id of mapConfig.markerDataSourceIds) {
    ids.add(id);
  }
  if (mapConfig.membersDataSourceId) {
    ids.add(mapConfig.membersDataSourceId);
  }

  if (view.config.areaDataSourceId) {
    ids.add(view.config.areaDataSourceId);
  }

  return [...ids];
}
