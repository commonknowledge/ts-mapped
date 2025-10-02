import { TRPCError } from "@trpc/server";
import z from "zod";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";
import {
  CalculationType,
  MapStyleName,
  VisualisationType,
} from "@/server/models/MapView";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findFoldersByMapId } from "@/server/repositories/Folder";
import {
  createMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
import { upsertMapView } from "@/server/repositories/MapView";
import { findPlacedMarkersByMapId } from "@/server/repositories/PlacedMarker";
import { findTurfsByMapId } from "@/server/repositories/Turf";
import { db } from "@/server/services/database";
import { mapReadProcedure, organisationProcedure, router } from "../index";

export const mapRouter = router({
  get: mapReadProcedure.query(async ({ ctx }) => {
    // TODO: move this back into the repository after the apollo migration
    // (in place of findMapViewsByMapId)
    const mapViewQuery = db
      .selectFrom("mapView")
      .where("mapId", "=", ctx.map.id)
      .select(["id", "config", "dataSourceViews", "name", "position"])
      .orderBy("position asc")
      .orderBy("id asc");

    const [folders, placedMarkers, turfs, views] = await Promise.all([
      findFoldersByMapId(ctx.map.id),
      findPlacedMarkersByMapId(ctx.map.id),
      findTurfsByMapId(ctx.map.id),
      mapViewQuery.execute(),
    ]);
    return {
      ...ctx.map,
      folders,
      placedMarkers,
      turfs,
      views,
    };
  }),
  list: organisationProcedure.query(async ({ ctx }) => {
    return findMapsByOrganisationId(ctx.organisation.id);
  }),
  create: organisationProcedure.mutation(async ({ ctx }) => {
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
            visualisationType: VisualisationType.Choropleth,
          },
        });
      }
      return map;
    }),
});
