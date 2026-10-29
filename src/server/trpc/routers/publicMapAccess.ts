import { TRPCError } from "@trpc/server";
import z from "zod";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { findPublicMapById } from "@/server/repositories/PublicMap";
import {
  findPublicMapAccessById,
  setPublicMapAccessStatus,
} from "@/server/repositories/PublicMapAccess";
import {
  requestPublicMapAccess,
  sendPublicMapAccessLink,
  verifyModerationToken,
} from "@/server/services/publicMapAccess";
import { getEmbedContext } from "@/utils/publicMapAccess";
import { publicProcedure, router } from "../index";
import type { PublicMapAccess } from "@/models/PublicMapAccess";
import type { PublicMapForAccess } from "@/server/services/publicMapAccess";

// The decisions a moderator can make from each status
const allowedDecisions: Record<PublicMapAccessStatus, PublicMapAccessStatus[]> =
  {
    [PublicMapAccessStatus.Pending]: [
      PublicMapAccessStatus.Approved,
      PublicMapAccessStatus.Rejected,
    ],
    [PublicMapAccessStatus.Approved]: [PublicMapAccessStatus.Revoked],
    [PublicMapAccessStatus.Rejected]: [PublicMapAccessStatus.Approved],
    [PublicMapAccessStatus.Revoked]: [PublicMapAccessStatus.Approved],
  };

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

/**
 * Resolve a moderator's review link to its access row and public map.
 * Moderators are not Mapped users: possession of the emailed link is the
 * authorisation, and it only covers that one request.
 */
async function findModeratedAccess(token: string) {
  const accessId = await verifyModerationToken(token);
  if (!accessId) {
    throw notFound();
  }
  const access = await findPublicMapAccessById(accessId);
  if (!access) {
    throw notFound();
  }
  const publicMap = await findPublicMapById(access.publicMapId);
  if (!publicMap) {
    throw notFound();
  }
  return { access, publicMap };
}

// What the review page shows: never the token hash
const toReviewState = ({
  access,
  mapName,
}: {
  access: { email: string; status: PublicMapAccessStatus; createdAt: Date };
  mapName: string;
}) => ({
  email: access.email,
  status: access.status,
  requestedAt: access.createdAt,
  mapName,
  allowedDecisions: allowedDecisions[access.status],
});

export const publicMapAccessRouter = router({
  request: publicProcedure
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Map not found" });
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
      await requestPublicMapAccess({
        publicMap,
        email: input.email,
        requestedFromUrl: context.kind === "embedded" ? context.pageUrl : null,
      });
    }),
  review: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { access, publicMap } = await findModeratedAccess(input.token);
      return toReviewState({ access, mapName: publicMap.name });
    }),
  decide: publicProcedure
    .input(
      z.object({
        token: z.string(),
        status: z.enum(PublicMapAccessStatus),
      }),
    )
    .mutation(async ({ input }) => {
      const { access, publicMap } = await findModeratedAccess(input.token);
      // Most likely another moderator decided first: the page refetches
      const alreadyDecided = new TRPCError({
        code: "CONFLICT",
        message: "This request has already been decided.",
      });
      if (!allowedDecisions[access.status].includes(input.status)) {
        throw alreadyDecided;
      }
      const updated = await setPublicMapAccessStatus({
        id: access.id,
        fromStatus: access.status,
        status: input.status,
      });
      if (!updated) {
        throw alreadyDecided;
      }
      if (updated.status === PublicMapAccessStatus.Approved) {
        await sendApprovalLink({
          publicMap,
          access: updated,
          previousStatus: access.status,
        });
      }
      return toReviewState({ access: updated, mapName: publicMap.name });
    }),
});

/**
 * Email a newly approved visitor their link. If that fails, the approval
 * is undone, so the review page never claims a link was sent when it
 * wasn't, and the moderator can try again.
 */
async function sendApprovalLink({
  publicMap,
  access,
  previousStatus,
}: {
  publicMap: PublicMapForAccess;
  access: PublicMapAccess;
  previousStatus: PublicMapAccessStatus;
}) {
  let sent = false;
  let sendError: unknown = null;
  try {
    sent = await sendPublicMapAccessLink({ publicMap, access });
  } catch (error) {
    sendError = error;
  }
  if (sent) {
    return;
  }
  await setPublicMapAccessStatus({
    id: access.id,
    fromStatus: PublicMapAccessStatus.Approved,
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
