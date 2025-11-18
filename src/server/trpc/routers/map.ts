import { TRPCError } from "@trpc/server";
import z from "zod";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { mapConfigSchema, mapSchema } from "@/server/models/Map";
import {
  CalculationType,
  MapStyleName,
  mapViewSchema,
} from "@/server/models/MapView";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findFoldersByMapId } from "@/server/repositories/Folder";
import {
  createMap,
  deleteMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
import {
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";
import { findTurfsByMapId } from "@/server/repositories/Turf";
import { deleteFile } from "@/server/services/minio";
import {
  mapReadProcedure,
  mapWriteProcedure,
  organisationProcedure,
  router,
} from "../index";

export const mapRouter = router({
  list: organisationProcedure.query(async ({ ctx }) => {
    return findMapsByOrganisationId(ctx.organisation.id);
  }),
  create: organisationProcedure.mutation(({ ctx }) => {
    return createMap(ctx.organisation.id);
  }),
  createFromDataSource: organisationProcedure
    .input(z.object({ dataSourceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dataSource = await findDataSourceById(input.dataSourceId);
      if (!dataSource) throw new TRPCError({ code: "NOT_FOUND" });

      const map = await createMap(ctx.organisation.id);

      if (
        dataSource.recordType === DataSourceRecordType.Members ||
        dataSource.recordType !== DataSourceRecordType.Data
      ) {
        return updateMap(map.id, {
          config:
            dataSource.recordType === DataSourceRecordType.Members
              ? {
                  membersDataSourceId: input.dataSourceId,
                  markerDataSourceIds: [],
                }
              : {
                  markerDataSourceIds: [input.dataSourceId],
                  membersDataSourceId: null,
                },
        });
      } else {
        await upsertMapView({
          mapId: map.id,
          name: "Default View",
          dataSourceViews: [],
          position: 0,
          config: {
            areaDataColumn: "",
            areaDataSourceId: input.dataSourceId,
            areaSetGroupCode: AreaSetGroupCode.WMC24,
            calculationType: CalculationType.Count,
            colorScheme: null,
            excludeColumnsString: "",
            mapStyleName: MapStyleName.Light,
            reverseColorScheme: false,
            showBoundaryOutline: true,
            showLabels: true,
            showLocations: true,
            showMembers: true,
            showTurf: true,
          },
        });
      }
      return map;
    }),
  byId: mapReadProcedure.query(async ({ ctx: { map } }) => {
    const [folders, placedMarkers, turfs, views] = await Promise.all([
      findFoldersByMapId(map.id),
      findPlacedMarkersByMapId(map.id),
      findTurfsByMapId(map.id),
      findMapViewsByMapId(map.id),
    ]);
    return { ...map, folders, placedMarkers, turfs, views };
  }),

  update: mapWriteProcedure
    .input(
      mapSchema
        .omit({ createdAt: true, id: true, organisationId: true })
        .partial(),
    )
    .mutation(async ({ ctx: { map }, input: { mapId, ...data } }) => {
      const mapUpdate = await updateMap(mapId, data);

      // Clean up old image
      if (
        map.imageUrl &&
        mapUpdate.imageUrl &&
        map.imageUrl !== mapUpdate.imageUrl
      ) {
        await deleteFile(map.imageUrl);
      }
      return mapUpdate;
    }),

  updateConfig: mapWriteProcedure
    .input(z.object({ config: mapConfigSchema.partial() }))
    .mutation(async ({ input }) => {
      const { mapId, config: mapConfig } = input;

      const config = {
        markerDataSourceIds: mapConfig.markerDataSourceIds?.filter(Boolean),
        membersDataSourceId: mapConfig.membersDataSourceId,
      } as z.infer<typeof mapConfigSchema>;

      return updateMap(mapId, { config });
    }),

  updateViews: mapWriteProcedure
    .input(
      z.object({
        views: z.array(mapViewSchema.omit({ createdAt: true, mapId: true })),
      }),
    )
    .mutation(async ({ input }) => {
      const { mapId, views } = input;

      for (const view of views) {
        await upsertMapView({ ...view, mapId });
      }
      return true;
    }),

  delete: mapWriteProcedure.mutation(async ({ ctx: { map } }) => {
    await deleteMap(map.id);
    return true;
  }),
});
