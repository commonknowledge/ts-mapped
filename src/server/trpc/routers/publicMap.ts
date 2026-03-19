import { TRPCError } from "@trpc/server";
import z from "zod";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { publicMapDraftSchema } from "@/server/models/PublicMap";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { createMap, updateMap } from "@/server/repositories/Map";
import {
  applyDraft,
  checkHostAvailability,
  deletePublicMap,
  discardDraft,
  findPublicMapByHost,
  findPublicMapByViewId,
  findPublicMapByViewIdAndUserId,
  findPublicMapsByOrganisationId,
  saveDraft,
  unpublishPublicMap,
} from "@/server/repositories/PublicMap";
import { canReadDataSource } from "@/server/utils/auth";
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
  // TODO: verify that the user has access to the provided data source
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
      const canRead = await canReadDataSource(dataSource, ctx.user.id);
      if (!canRead) {
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

      // 3. View and Public Map creation are handled on the front-end
      // to avoid duplication

      return { mapId: map.id };
    }),
  get: publicProcedure
    .input(
      z.object({
        viewId: z.string().optional(),
        host: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      let publicMap;

      if (input.host) {
        publicMap = await findPublicMapByHost(input.host);
      } else if (input.viewId) {
        publicMap = await findPublicMapByViewId(input.viewId);
      }

      if (!publicMap) return null;

      const userId = ctx.user?.id;
      const ownedMap = userId
        ? await findPublicMapByViewIdAndUserId(publicMap.viewId, userId)
        : null;

      // Published maps are visible to everyone
      if (publicMap.published) {
        // Remove the draft if the user does not own the map
        return ownedMap ? publicMap : { ...publicMap, draft: null };
      }

      // Unpublished maps are only visible to authenticated owners
      return ownedMap;
    }),
  saveDraft: mapWriteProcedure
    .input(
      z.object({
        viewId: z.string(),
        publicMapId: z.string(),
        draft: publicMapDraftSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return saveDraft({
        id: input.publicMapId,
        mapId: ctx.map.id,
        viewId: input.viewId,
        draft: input.draft,
      });
    }),
  applyDraft: mapWriteProcedure
    .input(
      z.object({
        viewId: z.string(),
        publicMapId: z.string(),
        draft: publicMapDraftSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check hostname availability before publishing
      if (input.draft.host) {
        const existing = await checkHostAvailability(
          input.draft.host,
          input.viewId,
        );
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A public map already exists for this subdomain.",
          });
        }
      }

      return applyDraft({
        id: input.publicMapId,
        mapId: ctx.map.id,
        viewId: input.viewId,
        draft: input.draft,
      });
    }),
  discardDraft: mapWriteProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await discardDraft(input.viewId);
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No public map found to discard draft from.",
        });
      }
      return result;
    }),
  checkHostAvailability: protectedProcedure
    .input(
      z.object({
        host: z.string(),
        viewId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const existing = await checkHostAvailability(input.host, input.viewId);
      return { available: !existing };
    }),
  delete: organisationProcedure
    .input(z.object({ publicMapId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await deletePublicMap(input.publicMapId);
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Public map not found.",
        });
      }
      return result;
    }),
  unpublish: organisationProcedure
    .input(z.object({ publicMapId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await unpublishPublicMap(input.publicMapId);
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Public map not found.",
        });
      }
      return result;
    }),
});
