import { TRPCError } from "@trpc/server";
import z from "zod";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";
import {
  CalculationType,
  MapStyleName,
  VisualisationType,
} from "@/server/models/MapView";
import { publicMapSchema } from "@/server/models/PublicMap";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findFoldersByMapId } from "@/server/repositories/Folder";
import {
  createMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
import {
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";
import {
  findPublicMapByHost,
  findPublicMapByViewId,
  upsertPublicMap,
} from "@/server/repositories/PublicMap";
import { findTurfsByMapId } from "@/server/repositories/Turf";
import {
  mapProcedure,
  organisationProcedure,
  publicMapViewProcedure,
  router,
} from "../index";

export const mapRouter = router({
  list: organisationProcedure.query(({ ctx }) => {
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
            showBoundaryOutline: true,
            showLabels: true,
            showLocations: true,
            showMembers: true,
            showTurf: true,
            visualisationType: VisualisationType.Choropleth,
          },
        });
      }
      return map;
    }),
  byId: mapProcedure.query(async ({ ctx: { map } }) => {
    const [folders, placedMarkers, turfs, views] = await Promise.all([
      findFoldersByMapId(map.id),
      findPlacedMarkersByMapId(map.id),
      findTurfsByMapId(map.id),
      findMapViewsByMapId(map.id),
    ]);
    return { ...map, folders, placedMarkers, turfs, views };
  }),
  publicByViewId: publicMapViewProcedure.query(({ input }) => {
    return findPublicMapByViewId(input.viewId);
  }),

  updatePublicMap: publicMapViewProcedure
    .input(publicMapSchema.omit({ createdAt: true, mapId: true, id: true }))
    .mutation(async ({ input, ctx: { view } }) => {
      const publicMap = findPublicMapByViewId(input.viewId);

      const existingPublicMap = await findPublicMapByHost(input.host);
      if (existingPublicMap && existingPublicMap.viewId !== input.viewId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A public map already exists for this subdomain.",
        });
      }
      if (!publicMap) throw new TRPCError({ code: "NOT_FOUND" });
      return upsertPublicMap({ ...publicMap, ...input, mapId: view.mapId });
    }),
});
