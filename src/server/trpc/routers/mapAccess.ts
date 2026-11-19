import { TRPCError } from "@trpc/server";
import z from "zod";
import { MapAccessStatus } from "@/models/MapAccess";
import { PublicMapAccessMode } from "@/models/PublicMap";
import {
  findMapAccessById,
  setMapAccessStatus,
} from "@/server/repositories/MapAccess";
import { findMapShareByToken } from "@/server/repositories/MapShare";
import { findPublicMapById } from "@/server/repositories/PublicMap";
import {
  findMapAccessTarget,
  findMapShareForAccess,
  getMapAccessTargetName,
  requestMapAccess,
  sendMapAccessLink,
  verifyModerationToken,
} from "@/server/services/mapAccess";
import { getEmbedContext } from "@/utils/publicMapAccess";
import { publicProcedure, router } from "../index";
import type { MapAccess } from "@/models/MapAccess";
import type { MapAccessTarget } from "@/server/services/mapAccess";

// The decisions a moderator can make from each status
const allowedDecisions: Record<MapAccessStatus, MapAccessStatus[]> = {
  [MapAccessStatus.Pending]: [
    MapAccessStatus.Approved,
    MapAccessStatus.Rejected,
  ],
  [MapAccessStatus.Approved]: [MapAccessStatus.Revoked],
  [MapAccessStatus.Rejected]: [MapAccessStatus.Approved],
  [MapAccessStatus.Revoked]: [MapAccessStatus.Approved],
};

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

const mapNotFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Map not found" });

/**
 * Resolve a moderator's review link to its access row and what it is for
 * (a public map or a map share). Moderators are not Mapped users:
 * possession of the emailed link is the authorisation, and it only covers
 * that one request.
 */
async function findModeratedAccess(token: string) {
  const accessId = await verifyModerationToken(token);
  if (!accessId) {
    throw notFound();
  }
  const access = await findMapAccessById(accessId);
  if (!access) {
    throw notFound();
  }
  const target = await findMapAccessTarget(access);
  if (!target) {
    throw notFound();
  }
  return { access, target };
}

// What the review page shows: never the token hash
const toReviewState = ({
  access,
  mapName,
}: {
  access: { email: string; status: MapAccessStatus; createdAt: Date };
  mapName: string;
}) => ({
  email: access.email,
  status: access.status,
  requestedAt: access.createdAt,
  mapName,
  allowedDecisions: allowedDecisions[access.status],
});

export const mapAccessRouter = router({
  requestPublicMap: publicProcedure
    .input(
      z.object({
        publicMapId: z.string(),
        email: z.email(),
        // The embedding page, as reported by embed.js; absent when the map
        // is opened at its own address
        pageUrl: z.string().nullish(),
      }),
    )
    .mutation(async ({ input }) => {
      const publicMap = await findPublicMapById(input.publicMapId);
      const acceptsRequests =
        publicMap?.published &&
        publicMap.accessMode === PublicMapAccessMode.Moderated;
      if (!publicMap || !acceptsRequests) {
        throw mapNotFound();
      }
      const context = getEmbedContext({
        embedOrigins: publicMap.embedOrigins,
        pageUrl: input.pageUrl,
      });
      if (context.kind === "unlisted") {
        // The gate already shows this instead of the form; this is the
        // backstop that keeps magic links off unlisted sites
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This map hasn't been set up to be embedded on this site.",
        });
      }
      await requestMapAccess({
        target: { kind: "publicMap", publicMap },
        email: input.email,
        requestedFromUrl: context.kind === "embedded" ? context.pageUrl : null,
      });
    }),
  requestMapShare: publicProcedure
    .input(z.object({ shareToken: z.string(), email: z.email() }))
    .mutation(async ({ input }) => {
      const share = await findMapShareByToken(input.shareToken);
      const mapShare = share?.enabled
        ? await findMapShareForAccess(share.id)
        : null;
      if (!mapShare) {
        throw mapNotFound();
      }
      await requestMapAccess({
        target: { kind: "mapShare", mapShare },
        email: input.email,
        requestedFromUrl: null,
      });
    }),
  review: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { access, target } = await findModeratedAccess(input.token);
      return toReviewState({ access, mapName: getMapAccessTargetName(target) });
    }),
  decide: publicProcedure
    .input(
      z.object({
        token: z.string(),
        status: z.enum(MapAccessStatus),
      }),
    )
    .mutation(async ({ input }) => {
      const { access, target } = await findModeratedAccess(input.token);
      // Most likely another moderator decided first: the page refetches
      const alreadyDecided = new TRPCError({
        code: "CONFLICT",
        message: "This request has already been decided.",
      });
      if (!allowedDecisions[access.status].includes(input.status)) {
        throw alreadyDecided;
      }
      const updated = await setMapAccessStatus({
        id: access.id,
        fromStatus: access.status,
        status: input.status,
      });
      if (!updated) {
        throw alreadyDecided;
      }
      if (updated.status === MapAccessStatus.Approved) {
        await sendApprovalLink({
          target,
          access: updated,
          previousStatus: access.status,
        });
      }
      return toReviewState({
        access: updated,
        mapName: getMapAccessTargetName(target),
      });
    }),
});

/**
 * Email a newly approved visitor their link. If that fails, the approval
 * is undone, so the review page never claims a link was sent when it
 * wasn't, and the moderator can try again.
 */
async function sendApprovalLink({
  target,
  access,
  previousStatus,
}: {
  target: MapAccessTarget;
  access: MapAccess;
  previousStatus: MapAccessStatus;
}) {
  let sent = false;
  let sendError: unknown = null;
  try {
    sent = await sendMapAccessLink({ target, access });
  } catch (error) {
    sendError = error;
  }
  if (sent) {
    return;
  }
  await setMapAccessStatus({
    id: access.id,
    fromStatus: MapAccessStatus.Approved,
    status: previousStatus,
  });
  if (sendError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Couldn't email the visitor their link. Please try again.",
      cause: sendError,
    });
  }
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      "There's nowhere to send the visitor: the website they asked from is no longer listed, and the map has no address of its own. Give the map a subdomain or list the website again, then publish and try again.",
  });
}
