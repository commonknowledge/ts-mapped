import { TRPCError } from "@trpc/server";
import z from "zod";
import { DataSourceRecordType } from "@/models/DataSource";
import { PublicMapAccessMode, publicMapDraftSchema } from "@/models/PublicMap";
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
import { canReadDataSource, canViewPublicMap } from "@/server/utils/auth";
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
      const canRead = await canReadDataSource({
        dataSource,
        userId: ctx.user.id,
      });
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
          name: dataSource.name,
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

      // Owners always see everything, including the draft
      if (ownedMap) {
        return { ...ownedMap, accessGranted: true };
      }

      // Unpublished maps are only visible to authenticated owners
      if (!publicMap.published) {
        return null;
      }

      // Visitors never see the draft or who moderates the map
      const visitorMap = { ...publicMap, draft: null, moderatorEmails: [] };

      const accessGranted = await canViewPublicMap({
        publicMap,
        grants: ctx.grants,
      });
      if (accessGranted) {
        return { ...visitorMap, accessGranted };
      }

      // A moderated map the visitor has no access to yet: return only what
      // the access request form shows (name, description, styling), not
      // which data sources and columns the map exposes
      return { ...visitorMap, dataSourceConfigs: [], accessGranted };
    }),
  saveDraft: mapWriteProcedure
    .input(
      z.object({
        viewId: z.string(),
        publicMapId: z.string(),
        draft: publicMapDraftSchema,
        listed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return saveDraft({
        id: input.publicMapId,
        mapId: ctx.map.id,
        viewId: input.viewId,
        draft: input.draft,
        listed: input.listed,
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

      const moderatedWithoutModerators =
        input.draft.published &&
        input.draft.accessMode === PublicMapAccessMode.Moderated &&
        input.draft.moderatorEmails.length === 0;
      if (moderatedWithoutModerators) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one moderator email before publishing.",
        });
      }

      const publicMap = await applyDraft({
        id: input.publicMapId,
        mapId: ctx.map.id,
        viewId: input.viewId,
        draft: input.draft,
      });
      // Same shape as publicMap.get, so the editor can put it in the cache
      return { ...publicMap, accessGranted: true };
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
      return { ...result, accessGranted: true };
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
