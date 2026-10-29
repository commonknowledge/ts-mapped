import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { db } from "@/server/services/database";

export function findPublicMapAccessById(id: string) {
  return db
    .selectFrom("publicMapAccess")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

/**
 * Record a visitor's request for access. A repeat request for the same
 * email returns the existing row unchanged, whatever its status.
 */
export async function findOrCreatePublicMapAccess({
  publicMapId,
  email,
}: {
  publicMapId: string;
  email: string;
}) {
  const created = await db
    .insertInto("publicMapAccess")
    .values({
      publicMapId,
      email: email.toLowerCase(),
      status: PublicMapAccessStatus.Pending,
      tokenHash: null,
      tokenIssuedAt: null,
      decidedAt: null,
    })
    .onConflict((oc) => oc.columns(["publicMapId", "email"]).doNothing())
    .returningAll()
    .executeTakeFirst();
  if (created) {
    return { access: created, created: true };
  }
  const access = await db
    .selectFrom("publicMapAccess")
    .where("publicMapId", "=", publicMapId)
    .where("email", "=", email.toLowerCase())
    .selectAll()
    .executeTakeFirstOrThrow();
  return { access, created: false };
}

/**
 * Approve, reject or revoke. Bumps `decidedAt`, which invalidates any
 * grant minted before this decision.
 */
export function setPublicMapAccessStatus({
  id,
  status,
}: {
  id: string;
  status: PublicMapAccessStatus;
}) {
  return db
    .updateTable("publicMapAccess")
    .set({ status, decidedAt: new Date() })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}
