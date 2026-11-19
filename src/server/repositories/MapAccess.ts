import { MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { MapAccessStatus } from "@/models/MapAccess";
import { db } from "@/server/services/database";
import { mapAccessTargetColumn } from "@/utils/mapAccess";
import type { MapAccessTargetRef } from "@/models/MapAccess";

export function findMapAccessById(id: string) {
  return db
    .selectFrom("mapAccess")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

/** The access row a magic link is for, with when that link was issued. */
export function findMapAccessByTokenHash(tokenHash: string) {
  return db
    .selectFrom("mapAccessToken")
    .innerJoin("mapAccess", "mapAccess.id", "mapAccessToken.mapAccessId")
    .where("mapAccessToken.tokenHash", "=", tokenHash)
    .selectAll("mapAccess")
    .select("mapAccessToken.issuedAt as tokenIssuedAt")
    .executeTakeFirst();
}

/**
 * Record a visitor's request for access. A repeat request for the same
 * email keeps the existing row and its status, but records where it came
 * from (so a fresh magic link goes back there).
 */
export async function findOrCreateMapAccess({
  target,
  email,
  requestedFromUrl = null,
}: {
  target: MapAccessTargetRef;
  email: string;
  requestedFromUrl?: string | null;
}) {
  const column = mapAccessTargetColumn(target);
  const created = await db
    .insertInto("mapAccess")
    .values({
      publicMapId: target.kind === "publicMap" ? target.id : null,
      mapShareId: target.kind === "mapShare" ? target.id : null,
      email: email.toLowerCase(),
      status: MapAccessStatus.Pending,
      requestedFromUrl,
      moderatorsNotifiedAt: null,
      decidedAt: null,
    })
    .onConflict((oc) => oc.columns([column, "email"]).doNothing())
    .returningAll()
    .executeTakeFirst();
  if (created) {
    return { access: created, created: true };
  }
  const access = await db
    .updateTable("mapAccess")
    .set({ requestedFromUrl })
    .where(column, "=", target.id)
    .where("email", "=", email.toLowerCase())
    .returningAll()
    .executeTakeFirstOrThrow();
  return { access, created: false };
}

/** Record that moderators have been emailed about this request. */
export async function setMapAccessModeratorsNotified(id: string) {
  await db
    .updateTable("mapAccess")
    .set({ moderatorsNotifiedAt: new Date() })
    .where("id", "=", id)
    .execute();
}

/**
 * Store the hash of a newly issued magic link token. Earlier links keep
 * working until they expire; expired ones are cleared out here.
 */
export async function addMapAccessToken({
  mapAccessId,
  tokenHash,
}: {
  mapAccessId: string;
  tokenHash: string;
}) {
  const expiredBefore = new Date(
    Date.now() - MAP_ACCESS_LIFETIME_SECONDS * 1000,
  );
  await db
    .deleteFrom("mapAccessToken")
    .where("mapAccessId", "=", mapAccessId)
    .where("issuedAt", "<", expiredBefore)
    .execute();
  await db
    .insertInto("mapAccessToken")
    .values({ mapAccessId, tokenHash })
    .execute();
}

/**
 * Approve, reject or revoke. Only applies if the status is still
 * `fromStatus`, so two moderators deciding at once can't both succeed:
 * returns undefined for the one who lost.
 *
 * Bumps `decidedAt`, which invalidates any grant minted before this
 * decision. Anything but approval also deletes the visitor's magic links,
 * so approving them again later does not bring old links back to life.
 */
export function setMapAccessStatus({
  id,
  fromStatus,
  status,
}: {
  id: string;
  fromStatus: MapAccessStatus;
  status: MapAccessStatus;
}) {
  return db.transaction().execute(async (tx) => {
    const updated = await tx
      .updateTable("mapAccess")
      .set({ status, decidedAt: new Date() })
      .where("id", "=", id)
      .where("status", "=", fromStatus)
      .returningAll()
      .executeTakeFirst();
    if (updated && status !== MapAccessStatus.Approved) {
      await tx
        .deleteFrom("mapAccessToken")
        .where("mapAccessId", "=", id)
        .execute();
    }
    return updated;
  });
}
