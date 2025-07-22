import {
  ColumnDef,
  ColumnType,
  CreateDataSourceResponse,
  CreateMapResponse,
  GeocodingType,
  MutationResolvers as MutationResolversType,
  MutationResponse,
  MutationUpdateDataSourceConfigArgs,
  MutationUpdateMapArgs,
  MutationUpdateMapConfigArgs,
  PointInput,
  UpsertPlacedMarkerResponse,
  UpsertTurfResponse,
} from "@/__generated__/types";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  createDataSource,
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { createMap, findMapById, updateMap } from "@/server/repositories/Map";
import { insertMapView, updateMapView } from "@/server/repositories/MapView";
import {
  deletePlacedMarker,
  insertPlacedMarker,
  updatePlacedMarker,
} from "@/server/repositories/PlacedMarker";
import { deleteTurf, insertTurf, updateTurf } from "@/server/repositories/Turf";
import logger from "@/server/services/logger";
import { deleteFile } from "@/server/services/minio";
import { enqueue } from "@/server/services/queue";
import {
  DataSourceConfigSchema,
  EnrichmentSchema,
  GeocodingConfig,
  GeocodingConfigSchema,
} from "@/zod";

const MutationResolvers: MutationResolversType = {
  createDataSource: async (
    _: unknown,
    {
      name,
      organisationId,
      rawConfig,
    }: { name: string; organisationId: string; rawConfig: unknown },
  ): Promise<CreateDataSourceResponse> => {
    try {
      const config = DataSourceConfigSchema.parse(rawConfig);
      const adaptor = getDataSourceAdaptor(config);
      const firstRecord = adaptor ? await adaptor.fetchFirst() : null;
      if (!firstRecord) {
        return { code: 500 };
      }

      const columnDefs: ColumnDef[] = Object.keys(firstRecord.json).map(
        (key) => ({
          name: key,
          type: ColumnType.Unknown,
        }),
      );

      const geocodingConfig: GeocodingConfig = {
        type: GeocodingType.None,
      };
      const dataSource = await createDataSource({
        name,
        organisationId,
        autoEnrich: false,
        autoImport: false,
        config: JSON.stringify(config),
        columnRoles: JSON.stringify({}),
        enrichments: JSON.stringify([]),
        geocodingConfig: JSON.stringify(geocodingConfig),
        columnDefs: JSON.stringify(columnDefs),
      });

      logger.info(`Created ${config.type} data source: ${dataSource.id}`);
      return { code: 200, result: dataSource };
    } catch (error) {
      logger.error(`Could not create data source`, { error });
    }
    return { code: 500 };
  },
  createMap: async (
    _: unknown,
    { organisationId },
  ): Promise<CreateMapResponse> => {
    try {
      const map = await createMap(organisationId);
      return { result: map, code: 200 };
    } catch (error) {
      logger.error(`Could not create map`, { error });
    }
    return { code: 500 };
  },
  deletePlacedMarker: async (_: unknown, { id }: { id: string }) => {
    try {
      await deletePlacedMarker(id);
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not delete marker ${id}`, { error });
    }
    return { code: 500 };
  },
  deleteTurf: async (_: unknown, { id }: { id: string }) => {
    try {
      await deleteTurf(id);
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not delete turf ${id}`, { error });
    }
    return { code: 500 };
  },
  enqueueEnrichDataSourceJob: async (
    _: unknown,
    { dataSourceId }: { dataSourceId: string },
  ): Promise<MutationResponse> => {
    await enqueue("enrichDataSource", { dataSourceId });
    return { code: 200 };
  },
  enqueueImportDataSourceJob: async (
    _: unknown,
    { dataSourceId }: { dataSourceId: string },
  ): Promise<MutationResponse> => {
    await enqueue("importDataSource", { dataSourceId });
    return { code: 200 };
  },
  updateDataSourceConfig: async (
    _: unknown,
    {
      id,
      columnRoles,
      looseEnrichments,
      looseGeocodingConfig,
      autoEnrich,
      autoImport,
    }: MutationUpdateDataSourceConfigArgs,
  ): Promise<MutationResponse> => {
    try {
      const dataSource = await findDataSourceById(id);
      if (!dataSource) {
        return { code: 404 };
      }

      const adaptor = getDataSourceAdaptor(dataSource.config);

      const update: {
        columnRoles?: string;
        enrichments?: string;
        geocodingConfig?: string;
        autoEnrich?: boolean;
        autoImport?: boolean;
      } = {};

      // Keep track of whether webhooks need to be enabled/disabled
      const nextAutoStatus = {
        autoEnrich: dataSource.autoEnrich,
        autoImport: dataSource.autoImport,
        changed: false,
      };

      if (typeof autoEnrich === "boolean") {
        update.autoEnrich = autoEnrich;
        nextAutoStatus.changed = dataSource.autoEnrich !== autoEnrich;
        nextAutoStatus.autoEnrich = autoEnrich;
      }

      if (typeof autoImport === "boolean") {
        update.autoImport = autoImport;
        nextAutoStatus.changed = dataSource.autoImport !== autoImport;
        nextAutoStatus.autoImport = autoImport;
      }

      if (nextAutoStatus.changed) {
        const enable = nextAutoStatus.autoEnrich || nextAutoStatus.autoImport;
        await adaptor?.toggleWebhook(dataSource.id, enable);
      }

      if (columnRoles) {
        update.columnRoles = JSON.stringify(columnRoles);
      }

      if (looseEnrichments) {
        const enrichments = [];
        for (const enrichment of looseEnrichments) {
          enrichments.push(EnrichmentSchema.parse(enrichment));
        }
        update.enrichments = JSON.stringify(enrichments);
      }

      if (looseGeocodingConfig) {
        const geocodingConfig =
          GeocodingConfigSchema.parse(looseGeocodingConfig);
        update.geocodingConfig = JSON.stringify(geocodingConfig);
      }

      await updateDataSource(id, update);
      logger.info(
        `Updated ${dataSource.config.type} data source config: ${dataSource.id}`,
      );
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not update data source`, { error });
    }
    return { code: 500 };
  },
  updateMap: async (_: unknown, args: MutationUpdateMapArgs) => {
    try {
      const map = await findMapById(args.id);
      if (!map) {
        return { code: 404 };
      }
      // Name cannot be set to null or the empty string
      const mapUpdate = { ...args.map, name: args.map.name || undefined };
      const updatedMap = await updateMap(args.id, mapUpdate);

      // Clean up old image
      if (
        map.imageUrl &&
        mapUpdate.imageUrl &&
        map.imageUrl !== mapUpdate.imageUrl
      ) {
        await deleteFile(map.imageUrl);
      }

      return { code: 200, result: updatedMap };
    } catch (error) {
      logger.error(`Could not update map: ${JSON.stringify(args)}`, {
        error,
      });
    }
    return { code: 500 };
  },
  updateMapConfig: async (_: unknown, args: MutationUpdateMapConfigArgs) => {
    try {
      const { mapId, mapConfig, viewId, viewConfig } = args;
      let updatedMapView = null;
      await updateMap(mapId, { config: JSON.stringify(mapConfig) });
      if (viewId) {
        updatedMapView = await updateMapView(viewId, {
          config: JSON.stringify(viewConfig),
        });
      } else {
        updatedMapView = await insertMapView({
          config: JSON.stringify(viewConfig),
          mapId: args.mapId,
        });
      }
      return { code: 200, result: updatedMapView.id };
    } catch (error) {
      logger.error(`Could not upsert map view: ${JSON.stringify(args)}`, {
        error,
      });
    }
    return { code: 500 };
  },
  upsertPlacedMarker: async (
    _: unknown,
    {
      id,
      label,
      notes,
      point,
      mapId,
    }: {
      id?: string | null;
      label: string;
      notes: string;
      point: PointInput;
      mapId: string;
    },
  ): Promise<UpsertPlacedMarkerResponse> => {
    try {
      const map = await findMapById(mapId);
      if (!map) {
        return { code: 404 };
      }
      const placedMarkerInput = {
        label,
        notes,
        point,
        mapId,
      };
      let placedMarker = null;
      if (id) {
        placedMarker = await updatePlacedMarker(id, placedMarkerInput);
      } else {
        placedMarker = await insertPlacedMarker(placedMarkerInput);
      }
      return { code: 200, result: placedMarker };
    } catch (error) {
      logger.error(`Could not create placed marker`, { error });
    }
    return { code: 500 };
  },
  upsertTurf: async (
    _: unknown,
    {
      id,
      label,
      notes,
      area,
      geometry,
      createdAt,
      mapId,
    }: {
      id?: string | null;
      label: string;
      notes: string;
      area: number;
      geometry: unknown;
      createdAt: string;
      mapId: string;
    },
  ): Promise<UpsertTurfResponse> => {
    try {
      const map = await findMapById(mapId);
      if (!map) {
        return { code: 404 };
      }
      const turfInput = {
        label,
        notes,
        area,
        geometry: JSON.stringify(geometry),
        createdAt: new Date(createdAt),
        mapId,
      };
      let turf = null;
      if (id) {
        turf = await updateTurf(id, turfInput);
      } else {
        turf = await insertTurf(turfInput);
      }
      return { code: 200, result: turf };
    } catch (error) {
      logger.error(`Could not create placed marker`, { error });
    }
    return { code: 500 };
  },
};

export default MutationResolvers;
