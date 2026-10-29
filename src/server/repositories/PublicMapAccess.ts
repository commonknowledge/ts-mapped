import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { db } from "@/server/services/database";

export function findPublicMapAccessById(id: string) {
  return db
    .selectFrom("publicMapAccess")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function findPublicMapAccessByTokenHash(tokenHash: string) {
  return db
    .selectFrom("publicMapAccess")
    .where("tokenHash", "=", tokenHash)
    .selectAll()
    .executeTakeFirst();
}

/**
 * Record a visitor's request for access. A repeat request for the same
 * email keeps the existing row and its status, but remembers the page it
 * came from, if known (so a fresh magic link goes back to that page).
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
      tokenHash: null,
      tokenIssuedAt: null,
      requestedFromUrl,
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
    .set(({ fn, ref, val }) => ({
      requestedFromUrl: fn.coalesce(
        val(requestedFromUrl),
        ref("requestedFromUrl"),
      ),
    }))
    .where("publicMapId", "=", publicMapId)
    .where("email", "=", email.toLowerCase())
    .returningAll()
    .executeTakeFirstOrThrow();
  return { access, created: false };
}

/**
 * Store the hash of a newly issued magic link token, replacing (and so
 * invalidating) any previous link for this row.
 */
export function setPublicMapAccessTokenHash({
  id,
  tokenHash,
}: {
  id: string;
  tokenHash: string;
}) {
  return db
    .updateTable("publicMapAccess")
    .set({ tokenHash, tokenIssuedAt: new Date() })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
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
