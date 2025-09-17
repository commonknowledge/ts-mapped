import { TRPCError } from "@trpc/server";
import z from "zod";
// import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { DataSourceRecordType } from "@/server/models/DataSource";
// import { MapStyleName } from "@/server/models/MapView";
import { findDataSourceById } from "@/server/repositories/DataSource";
import {
  createMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
// import { upsertMapView } from "@/server/repositories/MapView";
import { organisationProcedure, router } from "../index";

export const mapRouter = router({
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
        dataSource.recordType === DataSourceRecordType.Data
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
                  membersDataSourceId: "",
                },
        });
      } else {
        // await upsertMapView({
        //   mapId: map.id,
        //   name: "Default View",
        //   dataSourceViews: [],
        //   position: 0,
        //   config: {
        //     areaDataSourceId: input.dataSourceId,
        //     areaDataColumn: "",
        //     areaSetGroupCode: AreaSetGroupCode.WMC24,
        //     excludeColumnsString: "",
        //     mapStyleName: MapStyleName.Light,
        //     showBoundaryOutline: true,
        //     showLabels: true,
        //     showLocations: true,
        //     showMembers: true,
        //     showTurf: true,
        //   },
        // });
      }
      return map;
    }),
});
