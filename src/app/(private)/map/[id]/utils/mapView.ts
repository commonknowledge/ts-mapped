import { ColorScheme, MapStyleName } from "@/models/MapView";
import { DEFAULT_CALCULATION_TYPE } from "@/models/shared";
import type { MapViewConfig, SavedVisualisation } from "@/models/MapView";

export const createNewViewConfig = (): MapViewConfig => {
  return {
    areaDataSourceId: "",
    areaDataColumn: "",
    areaSetGroupCode: undefined,
    mapStyleName: MapStyleName.Light,
    showLabels: true,
    showMembers: true,
    showLocations: true,
    showTurf: true,
    calculationType: DEFAULT_CALCULATION_TYPE,
    colorScheme: ColorScheme.Sequential,
    reverseColorScheme: false,
    hideFilteredMarkers: true,
  };
};

/** What a visualisation shows (source and columns), to match one view's
 *  with an entry in the map's shared list */
export const getVisualisationKey = (item: {
  areaDataSourceId?: string;
  areaDataColumn?: string;
  areaDataSecondaryColumn?: string | null;
}) =>
  [
    item.areaDataSourceId ?? "",
    item.areaDataColumn ?? "",
    item.areaDataSecondaryColumn ?? "",
  ].join("|");

/** A view's live visualisation as a list entry */
export const snapshotVisualisation = (
  config: MapViewConfig,
  id: string,
): SavedVisualisation => ({
  id,
  areaDataSourceId: config.areaDataSourceId,
  areaDataColumn: config.areaDataColumn,
  areaDataSecondaryColumn: config.areaDataSecondaryColumn,
  areaSetGroupCode: config.areaSetGroupCode,
  calculationType: config.calculationType,
  colorScheme: config.colorScheme,
  reverseColorScheme: config.reverseColorScheme,
  colorScaleType: config.colorScaleType,
  customColor: config.customColor,
  includeColumnsString: config.includeColumnsString,
});

const VISUALISATION_SETTING_KEYS = [
  "areaDataSourceId",
  "areaDataColumn",
  "areaDataSecondaryColumn",
  "areaSetGroupCode",
  "calculationType",
  "colorScheme",
  "reverseColorScheme",
  "colorScaleType",
  "customColor",
  "includeColumnsString",
] as const satisfies readonly (keyof SavedVisualisation)[];

/** Whether two entries have the same settings, ignoring their ids */
export const isSameVisualisation = (
  a: SavedVisualisation,
  b: SavedVisualisation,
) =>
  VISUALISATION_SETTING_KEYS.every(
    (key) => (a[key] ?? null) === (b[key] ?? null),
  );

/**
 * One list for the whole map from what its views had on their own: the
 * map's list so far, then each view's saved entries and the one it has on,
 * skipping any already there (same id, or same source and columns)
 */
export const mergeViewVisualisations = ({
  mapList,
  views,
  newId,
}: {
  mapList: SavedVisualisation[];
  views: MapViewConfig[];
  newId: () => string;
}): SavedVisualisation[] => {
  const merged = [...mapList];
  const has = (item: SavedVisualisation) =>
    merged.some(
      (existing) =>
        existing.id === item.id ||
        getVisualisationKey(existing) === getVisualisationKey(item),
    );
  for (const config of views) {
    const live = config.areaDataSourceId
      ? [snapshotVisualisation(config, config.activeVisualisationId ?? newId())]
      : [];
    for (const item of [...live, ...(config.savedVisualisations ?? [])]) {
      if (item.areaDataSourceId && !has(item)) merged.push(item);
    }
  }
  return merged;
};
