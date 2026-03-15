import { TRPCError } from "@trpc/server";
import z from "zod";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { CalculationType, MapStyleName } from "@/server/models/MapView";
import { publicMapSchema } from "@/server/models/PublicMap";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { createMap, updateMap } from "@/server/repositories/Map";
import { upsertMapView } from "@/server/repositories/MapView";
import {
  findPublicMapByHost,
  findPublicMapByViewIdAndUserId,
  findPublicMapsByOrganisationId,
  upsertPublicMap,
} from "@/server/repositories/PublicMap";
import {
  mapWriteProcedure,
  organisationProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../index";

export const publicMapRouter = router({
  list: organisationProcedure.query(async ({ ctx }) => {
    return findPublicMapsByOrganisationId(ctx.organisation.id);
  }),
  create: organisationProcedure
    .input(z.object({ dataSourceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dataSource = await findDataSourceById(input.dataSourceId);
      if (!dataSource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data source not found",
        });
      }

      const isMembers = dataSource.recordType === DataSourceRecordType.Members;
      const isData = dataSource.recordType === DataSourceRecordType.Data;

      // 1. Create the map
      const map = await createMap(ctx.organisation.id);

      // 2. Set data source on map config
      if (!isData) {
        await updateMap(map.id, {
          config: isMembers
            ? {
                membersDataSourceId: input.dataSourceId,
                markerDataSourceIds: [],
              }
            : {
                markerDataSourceIds: [input.dataSourceId],
                membersDataSourceId: null,
              },
        });
      }

      // 3. Create a default view
      const view = await upsertMapView({
        mapId: map.id,
        name: "Default View",
        dataSourceViews: [],
        position: 0,
        config: {
          areaDataColumn: "",
          areaDataSourceId: isData ? input.dataSourceId : "",
          areaSetGroupCode: AreaSetGroupCode.WMC24,
          calculationType: CalculationType.Count,
          colorScheme: null,
          mapStyleName: MapStyleName.Light,
          reverseColorScheme: false,
          showBoundaryOutline: true,
          showLabels: true,
          showLocations: true,
          showMembers: true,
          showTurf: true,
        },
      });

      // 4. Create the public map
      await upsertPublicMap({
        mapId: map.id,
        viewId: view.id,
        host: "",
        name: "My Public Map",
        description: "",
        descriptionLong: "",
        descriptionLink: "",
        imageUrl: "",
        published: false,
        dataSourceConfigs: [],
        colorScheme: "red",
      });

      return { mapId: map.id, viewId: view.id };
    }),
  getEditable: protectedProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ input, ctx }) => {
      const publicMap = await findPublicMapByViewIdAndUserId(
        input.viewId,
        ctx.user.id,
      );
      return publicMap || null;
    }),
  getPublished: publicProcedure
    .input(z.object({ host: z.string() }))
    .query(async ({ input }) => {
      const publicMap = await findPublicMapByHost(input.host);
      return publicMap?.published ? publicMap : null;
    }),
  upsert: mapWriteProcedure
    .input(publicMapSchema.omit({ createdAt: true, mapId: true, id: true }))
    .mutation(async ({ input }) => {
      const existingPublicMap = await findPublicMapByHost(input.host);

      if (existingPublicMap && existingPublicMap.viewId !== input.viewId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A public map already exists for this subdomain.",
        });
      }

      return upsertPublicMap(input);
    }),
});
