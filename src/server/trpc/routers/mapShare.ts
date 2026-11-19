import { TRPCError } from "@trpc/server";
import z from "zod";
import {
  findMapShareByMapId,
  setMapShareEnabled,
  setMapShareModeratorEmails,
} from "@/server/repositories/MapShare";
import { mapWriteProcedure, router } from "../index";
import type { MapShare } from "@/models/MapShare";

// The share state exposed to the map editor's share dialog
const toShareState = (share: MapShare) => ({
  token: share.token,
  enabled: share.enabled,
  moderatorEmails: share.moderatorEmails,
});

const shareNotFoundError = () =>
  new TRPCError({
    code: "NOT_FOUND",
    message: "Map share not found",
  });

export const mapShareRouter = router({
  get: mapWriteProcedure.query(async ({ ctx }) => {
    const share = await findMapShareByMapId(ctx.map.id);
    return share ? toShareState(share) : null;
  }),
  // As with publishing a moderated public map, sharing needs a moderator:
  // otherwise nobody would be told about access requests. A map shared for
  // the first time has the editor sharing it as its moderator, as the
  // share dialog shows before anything is saved.
  enable: mapWriteProcedure.mutation(async ({ ctx }) => {
    const existing = await findMapShareByMapId(ctx.map.id);
    if (!existing) {
      await setMapShareModeratorEmails({
        mapId: ctx.map.id,
        moderatorEmails: [ctx.user.email.toLowerCase()],
      });
    } else if (!existing.moderatorEmails.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Add at least one moderator email before sharing.",
      });
    }
    const share = await setMapShareEnabled({
      mapId: ctx.map.id,
      enabled: true,
    });
    if (!share) {
      throw shareNotFoundError();
    }
    return toShareState(share);
  }),
  disable: mapWriteProcedure.mutation(async ({ ctx }) => {
    const share = await setMapShareEnabled({
      mapId: ctx.map.id,
      enabled: false,
    });
    if (!share) {
      throw shareNotFoundError();
    }
    return toShareState(share);
  }),
  setModeratorEmails: mapWriteProcedure
    .input(z.object({ moderatorEmails: z.array(z.email()) }))
    .mutation(async ({ ctx, input }) => {
      const moderatorEmails = [
        ...new Set(input.moderatorEmails.map((email) => email.toLowerCase())),
      ];
      const existing = await findMapShareByMapId(ctx.map.id);
      const removingLastModerator =
        existing?.enabled && moderatorEmails.length === 0;
      if (removingLastModerator) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A shared map needs at least one moderator. Stop sharing before removing them all.",
        });
      }
      const share = await setMapShareModeratorEmails({
        mapId: ctx.map.id,
        moderatorEmails,
      });
      return toShareState(share);
    }),
});
