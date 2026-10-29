import { PUBLIC_MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { db } from "@/server/services/database";

export function findPublicMapAccessById(id: string) {
  return db
    .selectFrom("publicMapAccess")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

/** The access row a magic link is for, with when that link was issued. */
export function findPublicMapAccessByTokenHash(tokenHash: string) {
  return db
    .selectFrom("publicMapAccessToken")
    .innerJoin(
      "publicMapAccess",
      "publicMapAccess.id",
      "publicMapAccessToken.publicMapAccessId",
    )
    .where("publicMapAccessToken.tokenHash", "=", tokenHash)
    .selectAll("publicMapAccess")
    .select("publicMapAccessToken.issuedAt as tokenIssuedAt")
    .executeTakeFirst();
}

/**
 * Record a visitor's request for access. A repeat request for the same
 * email keeps the existing row and its status, but records where it came
 * from (so a fresh magic link goes back there).
 */
export async function findOrCreatePublicMapAccess({
  publicMapId,
  email,
  requestedFromUrl = null,
}: {
  publicMapId: string;
  email: string;
  requestedFromUrl?: string | null;
}) {
  const created = await db
    .insertInto("publicMapAccess")
    .values({
      publicMapId,
      email: email.toLowerCase(),
      status: PublicMapAccessStatus.Pending,
      requestedFromUrl,
      moderatorsNotifiedAt: null,
      decidedAt: null,
    })
    .onConflict((oc) => oc.columns(["publicMapId", "email"]).doNothing())
    .returningAll()
    .executeTakeFirst();
  if (created) {
    return { access: created, created: true };
  }
  const access = await db
    .updateTable("publicMapAccess")
    .set({ requestedFromUrl })
    .where("publicMapId", "=", publicMapId)
    .where("email", "=", email.toLowerCase())
    .returningAll()
    .executeTakeFirstOrThrow();
  return { access, created: false };
}

/** Record that moderators have been emailed about this request. */
export async function setPublicMapAccessModeratorsNotified(id: string) {
  await db
    .updateTable("publicMapAccess")
    .set({ moderatorsNotifiedAt: new Date() })
    .where("id", "=", id)
    .execute();
}

/**
 * Store the hash of a newly issued magic link token. Earlier links keep
 * working until they expire; expired ones are cleared out here.
 */
export async function addPublicMapAccessToken({
  publicMapAccessId,
  tokenHash,
}: {
  publicMapAccessId: string;
  tokenHash: string;
}) {
  const expiredBefore = new Date(
    Date.now() - PUBLIC_MAP_ACCESS_LIFETIME_SECONDS * 1000,
  );
  await db
    .deleteFrom("publicMapAccessToken")
    .where("publicMapAccessId", "=", publicMapAccessId)
    .where("issuedAt", "<", expiredBefore)
    .execute();
  await db
    .insertInto("publicMapAccessToken")
    .values({ publicMapAccessId, tokenHash })
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
export function setPublicMapAccessStatus({
  id,
  fromStatus,
  status,
}: {
  id: string;
  fromStatus: PublicMapAccessStatus;
  status: PublicMapAccessStatus;
}) {
  return db.transaction().execute(async (tx) => {
    const updated = await tx
      .updateTable("publicMapAccess")
      .set({ status, decidedAt: new Date() })
      .where("id", "=", id)
      .where("status", "=", fromStatus)
      .returningAll()
      .executeTakeFirst();
    if (updated && status !== PublicMapAccessStatus.Approved) {
      await tx
        .deleteFrom("publicMapAccessToken")
        .where("publicMapAccessId", "=", id)
        .execute();
    }
    return updated;
  });
}
