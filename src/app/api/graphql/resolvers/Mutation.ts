import { Polygon } from "geojson";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  ColumnDef,
  ColumnType,
  CreateDataSourceResponse,
  CreateMapResponse,
  DataSourceRecordType,
  GeocodingType,
  MutationResolvers as MutationResolversType,
  MutationResponse,
  MutationUpdateDataSourceConfigArgs,
  MutationUpdateMapArgs,
  MutationUpdateMapConfigArgs,
  PolygonInput,
  UpdateUserResponse,
  UpsertFolderResponse,
  UpsertPlacedMarkerResponse,
  UpsertPublicMapResponse,
  UpsertTurfResponse,
} from "@/__generated__/types";
import { getDataSourceAdaptor } from "@/server/adaptors";
import ForgotPassword from "@/server/emails/forgot-password";
import { countDataRecordsForDataSource } from "@/server/repositories/DataRecord";
import {
  createDataSource,
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { deleteFolder, upsertFolder } from "@/server/repositories/Folder";
import {
  createMap,
  deleteMap,
  findMapById,
  updateMap,
} from "@/server/repositories/Map";
import {
  findMapViewById,
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import {
  deletePlacedMarker,
  deletePlacedMarkersByFolderId,
  upsertPlacedMarker,
} from "@/server/repositories/PlacedMarker";
import {
  findPublicMapByHost,
  upsertPublicMap,
} from "@/server/repositories/PublicMap";
import { deleteTurf, insertTurf, updateTurf } from "@/server/repositories/Turf";
import {
  findUserByEmail,
  findUserByToken,
  updateUser,
} from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
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
      recordType,
      rawConfig,
    }: {
      name: string;
      organisationId: string;
      recordType: DataSourceRecordType;
      rawConfig: unknown;
    },
  ): Promise<CreateDataSourceResponse> => {
    try {
      const id = uuidv4();
      const config = DataSourceConfigSchema.parse(rawConfig);

      const adaptor = getDataSourceAdaptor({ id, config });

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
        id,
        name,
        organisationId,
        autoEnrich: false,
        autoImport: false,
        recordType,
        config: JSON.stringify(config),
        columnRoles: JSON.stringify({}),
        enrichments: JSON.stringify([]),
        geocodingConfig: JSON.stringify(geocodingConfig),
        columnDefs: JSON.stringify(columnDefs),
        public: false,
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
  deleteFolder: async (_: unknown, { id }: { id: string }) => {
    try {
      await deletePlacedMarkersByFolderId(id);
      await deleteFolder(id);
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not delete folder ${id}`, { error });
    }
    return { code: 500 };
  },
  deleteMap: async (_: unknown, { id }: { id: string }) => {
    try {
      await deleteMap(id);
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not delete map ${id}`, { error });
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
  saveMapViewsToCRM: async (
    _: unknown,
    { id }: { id: string },
  ): Promise<MutationResponse> => {
    const views = await findMapViewsByMapId(id);
    for (const view of views) {
      for (const dsv of view.dataSourceViews) {
        await enqueue("tagDataSource", {
          dataSourceId: dsv.dataSourceId,
          viewId: view.id,
        });
      }
    }
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

      const adaptor = getDataSourceAdaptor(dataSource);

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
        await adaptor?.toggleWebhook(enable);
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

      const recordCount = await countDataRecordsForDataSource(
        dataSource.id,
        null,
        null,
      );
      if (recordCount.count === 0) {
        await enqueue("importDataSource", { dataSourceId: id });
      }

      return { code: 200 };
    } catch (error) {
      logger.error(`Could not update data source`, { error });
    }
    return { code: 500 };
  },
  upsertFolder: async (_, args): Promise<UpsertFolderResponse> => {
    try {
      const map = await findMapById(args.mapId);
      if (!map) {
        return { code: 404 };
      }
      const folder = await upsertFolder(args);
      return { code: 200, result: folder };
    } catch (error) {
      logger.error(`Could not create folder`, { error });
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
      const { mapId, mapConfig, views } = args;
      await updateMap(mapId, { config: JSON.stringify(mapConfig) });
      for (const view of views) {
        await upsertMapView({
          ...view,
          config: JSON.stringify(view.config),
          dataSourceViews: JSON.stringify(view.dataSourceViews),
          mapId,
        });
      }
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not upsert map view: ${JSON.stringify(args)}`, {
        error,
      });
    }
    return { code: 500 };
  },
  upsertPlacedMarker: async (_, args): Promise<UpsertPlacedMarkerResponse> => {
    try {
      const map = await findMapById(args.mapId);
      if (!map) {
        return { code: 404 };
      }
      const placedMarker = await upsertPlacedMarker(args);
      return { code: 200, result: placedMarker };
    } catch (error) {
      logger.error(`Could not create placed marker`, { error });
    }
    return { code: 500 };
  },
  upsertPublicMap: async (
    _,
    {
      viewId,
      host,
      name,
      dataSourceConfigs,
      description,
      descriptionLink,
      published,
    },
  ): Promise<UpsertPublicMapResponse> => {
    try {
      const existingPublicMap = await findPublicMapByHost(host);
      if (existingPublicMap && existingPublicMap.viewId !== viewId) {
        return { code: 409 };
      }
      const view = await findMapViewById(viewId);
      if (!view) {
        return { code: 404 };
      }
      const map = await findMapById(view.mapId);
      if (!map) {
        return { code: 404 };
      }
      const result = await upsertPublicMap({
        mapId: view.mapId,
        viewId,
        host,
        name,
        dataSourceConfigs: JSON.stringify(dataSourceConfigs),
        description,
        descriptionLink,
        published,
      });
      return { code: 200, result };
    } catch (error) {
      logger.error(`Could not upsert public map`, { error });
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
      polygon,
      createdAt,
      mapId,
    }: {
      id?: string | null;
      label: string;
      notes: string;
      area: number;
      polygon: PolygonInput;
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
        polygon: polygon as Polygon,
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
  updateUser: async (_, args, { currentUser }): Promise<UpdateUserResponse> => {
    if (!currentUser) return { code: 401, result: null };
    const user = await updateUser(currentUser.id, args.data);
    return { code: 200, result: user };
  },
};

export default MutationResolvers;
