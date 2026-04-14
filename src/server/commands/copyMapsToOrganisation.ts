import {
  createDataSource,
  findDataSourceById,
} from "@/server/repositories/DataSource";
import { createMap, updateMap } from "@/server/repositories/Map";
import { findMapById } from "@/server/repositories/Map";
import {
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import type { MapConfig } from "@/models/Map";

interface MapSelection {
  mapId: string;
  dataSourceIds: string[];
}

/**
 * Copies selected maps (and optionally their data sources) to a target organisation.
 * Data sources not included in the selection are stripped from the copied maps/views.
 */
const copyMapsToOrganisation = async (
  mapSelections: MapSelection[],
  targetOrgId: string,
): Promise<void> => {
  // Shared across all selections so a data source referenced by multiple
  // maps is copied only once into the target org.
  const dataSourceIdMap = new Map<string, string>();

  for (const selection of mapSelections) {
    const originalMap = await findMapById(selection.mapId);
    if (!originalMap) {
      logger.warn(`Map ${selection.mapId} not found, skipping`);
      continue;
    }

    // Collect all data source IDs actually referenced by the source map,
    // so callers can't smuggle arbitrary IDs from other organisations.
    const views = await findMapViewsByMapId(originalMap.id);
    const referencedDsIds = new Set<string>();
    for (const id of originalMap.config.markerDataSourceIds) {
      if (id) referencedDsIds.add(id);
    }
    if (originalMap.config.membersDataSourceId) {
      referencedDsIds.add(originalMap.config.membersDataSourceId);
    }
    for (const view of views) {
      if (view.config.areaDataSourceId) {
        referencedDsIds.add(view.config.areaDataSourceId);
      }
      for (const dsv of view.dataSourceViews) {
        referencedDsIds.add(dsv.dataSourceId);
      }
    }

    // Copy selected data sources and build ID mapping
    for (const dsId of selection.dataSourceIds) {
      if (dataSourceIdMap.has(dsId)) continue;
      if (!referencedDsIds.has(dsId)) {
        logger.warn(
          `Data source ${dsId} is not referenced by map ${selection.mapId}, skipping`,
        );
        continue;
      }
      const original = await findDataSourceById(dsId);
      if (!original) {
        logger.warn(`Data source ${dsId} not found, skipping`);
        continue;
      }
      if (original.organisationId !== originalMap.organisationId) {
        logger.warn(
          `Data source ${dsId} does not belong to source map organisation, skipping`,
        );
        continue;
      }

      const copy = await createDataSource({
        name: original.name,
        organisationId: targetOrgId,
        autoEnrich: original.autoEnrich,
        autoImport: original.autoImport,
        config: original.config,
        columnRoles: original.columnRoles,
        enrichments: original.enrichments,
        geocodingConfig: original.geocodingConfig,
        columnDefs: original.columnDefs,
        columnMetadata: original.columnMetadata,
        public: false,
        recordType: original.recordType,
        defaultInspectorConfig: original.defaultInspectorConfig,
        defaultChoroplethConfig: original.defaultChoroplethConfig,
        dateFormat: original.dateFormat,
        naIsNull: original.naIsNull,
        nullIsZero: original.nullIsZero,
      });

      dataSourceIdMap.set(dsId, copy.id);
      await enqueue("importDataSource", copy.id, { dataSourceId: copy.id });
    }

    // Create the new map with remapped config
    const newMap = await createMap(targetOrgId, originalMap.name);
    const remappedConfig = remapMapConfig(originalMap.config, dataSourceIdMap);
    await updateMap(newMap.id, { config: remappedConfig });

    // Copy and remap views
    for (const view of views) {
      const remappedAreaDataSourceId = dataSourceIdMap.get(
        view.config.areaDataSourceId,
      );

      // Skip views whose area data source was not copied
      if (!remappedAreaDataSourceId) continue;

      const remappedDataSourceViews: typeof view.dataSourceViews = [];
      for (const dsv of view.dataSourceViews) {
        const newId = dataSourceIdMap.get(dsv.dataSourceId);
        if (newId)
          remappedDataSourceViews.push({ ...dsv, dataSourceId: newId });
      }

      await upsertMapView({
        name: view.name,
        position: view.position,
        mapId: newMap.id,
        config: {
          ...view.config,
          areaDataSourceId: remappedAreaDataSourceId,
        },
        dataSourceViews: remappedDataSourceViews,
      });
    }
  }
};

function remapMapConfig(
  config: MapConfig,
  dataSourceIdMap: Map<string, string>,
): MapConfig {
  const membersDataSourceId = config.membersDataSourceId
    ? (dataSourceIdMap.get(config.membersDataSourceId) ?? null)
    : null;

  const markerDataSourceIds: string[] = [];
  for (const id of config.markerDataSourceIds) {
    const newId = dataSourceIdMap.get(id);
    if (newId) markerDataSourceIds.push(newId);
  }

  return {
    ...config,
    membersDataSourceId,
    markerDataSourceIds,
    markerDisplayModes: remapRecord(config.markerDisplayModes, dataSourceIdMap),
    markerColors: remapRecord(config.markerColors, dataSourceIdMap),
    placedMarkerColors: undefined,
    folderColors: undefined,
  };
}

function remapRecord<T>(
  record: Record<string, T> | undefined,
  dataSourceIdMap: Map<string, string>,
): Record<string, T> | undefined {
  if (!record) return undefined;
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const newKey = dataSourceIdMap.get(key);
    if (newKey) {
      result[newKey] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export default copyMapsToOrganisation;
