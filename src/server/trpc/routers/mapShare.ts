import { TRPCError } from "@trpc/server";
import z from "zod";
import { passwordSchema } from "@/models/User";
import {
  findMapShareByMapId,
  regenerateMapShareToken,
  setMapShareEnabled,
  setMapSharePassword,
  upsertMapShareForMap,
} from "@/server/repositories/MapShare";
import { hashPassword } from "@/server/utils/auth";
import { mapWriteProcedure, router } from "../index";

// The share state exposed to the map editor's share dialog:
// never the password hash, only whether one is set.
const toShareState = (share: {
  token: string;
  enabled: boolean;
  passwordHash: string | null;
}) => ({
  token: share.token,
  enabled: share.enabled,
  hasPassword: Boolean(share.passwordHash),
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
  enable: mapWriteProcedure.mutation(async ({ ctx }) => {
    const share = await upsertMapShareForMap(ctx.map.id);
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
  setPassword: mapWriteProcedure
    .input(z.object({ password: passwordSchema.nullable() }))
    .mutation(async ({ ctx, input }) => {
      const passwordHash = input.password
        ? await hashPassword(input.password)
        : null;
      const share = await setMapSharePassword({
        mapId: ctx.map.id,
        passwordHash,
      });
      if (!share) {
        throw shareNotFoundError();
      }
      return toShareState(share);
    }),
  regenerateToken: mapWriteProcedure.mutation(async ({ ctx }) => {
    const share = await regenerateMapShareToken(ctx.map.id);
    if (!share) {
      throw shareNotFoundError();
    }
    return toShareState(share);
  }),
});
