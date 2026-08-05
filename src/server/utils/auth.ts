import { randomBytes, scrypt } from "crypto";
import { SHARE_GRANT_LIFETIME_SECONDS } from "@/constants";
import {
  findMapShareByMapId,
  findMapShareVisualisingDataSource,
} from "@/server/repositories/MapShare";
import { findOrganisationForUser } from "@/server/repositories/Organisation";
import { findPublishedPublicMapByDataSourceId } from "@/server/repositories/PublicMap";
import type { ShareGrant } from "@/authTypes";
import type { MapShare } from "@/models/MapShare";

/**
 * Checks whether a user can read a data source.
 * A data source is readable if:
 * 1. It is public, or
 * 2. It appears on a published public map, or
 * 3. It is visualised on a map the caller holds a valid share grant for, or
 * 4. The user belongs to the data source's organisation.
 */
export async function canReadDataSource({
  dataSource,
  userId,
  shareGrants,
}: {
  dataSource: { id: string; public: boolean; organisationId: string };
  userId: string | null | undefined;
  shareGrants?: ShareGrant[];
}): Promise<boolean> {
  if (dataSource.public) {
    return true;
  }

  const publicMap = await findPublishedPublicMapByDataSourceId(dataSource.id);
  if (publicMap) {
    return true;
  }

  const sharedMapIds = await getValidShareGrantMapIds(shareGrants);
  if (sharedMapIds.length > 0) {
    const mapShare = await findMapShareVisualisingDataSource({
      dataSourceId: dataSource.id,
      mapIds: sharedMapIds,
    });
    if (mapShare) {
      return true;
    }
  }

  if (!userId) {
    return false;
  }

  const organisation = await findOrganisationForUser(
    dataSource.organisationId,
    userId,
  );
  return Boolean(organisation);
}

/**
 * A grant from the share cookie is never sufficient on its own: it must
 * match the live mapShare row, which must be enabled, and — when a password
 * is currently set — the grant must have been minted after the last
 * password change. Grants also age out independently of the cookie.
 */
function isShareGrantValid(grant: ShareGrant, share: MapShare): boolean {
  if (!share.enabled || grant.shareId !== share.id) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (grant.iat + SHARE_GRANT_LIFETIME_SECONDS < nowSeconds) {
    return false;
  }
  if (share.passwordHash && share.passwordUpdatedAt) {
    const passwordUpdatedAtSeconds = Math.floor(
      share.passwordUpdatedAt.getTime() / 1000,
    );
    if (grant.iat < passwordUpdatedAtSeconds) {
      return false;
    }
  }
  return true;
}

/** Find a grant for this map and validate it against the live share row. */
export async function findValidShareGrantForMap(
  shareGrants: ShareGrant[] | undefined,
  mapId: string,
): Promise<ShareGrant | null> {
  const grant = shareGrants?.find((g) => g.mapId === mapId);
  if (!grant) {
    return null;
  }
  const share = await findMapShareByMapId(mapId);
  if (!share || !isShareGrantValid(grant, share)) {
    return null;
  }
  return grant;
}

/** The mapIds of all grants that validate against their live share rows. */
export async function getValidShareGrantMapIds(
  shareGrants: ShareGrant[] | undefined,
): Promise<string[]> {
  const mapIds: string[] = [];
  for (const grant of shareGrants ?? []) {
    const share = await findMapShareByMapId(grant.mapId);
    if (share && isShareGrantValid(grant, share)) {
      mapIds.push(grant.mapId);
    }
  }
  return mapIds;
}

/** Whether the caller holds at least one valid share grant. */
export async function hasValidShareGrant(
  shareGrants: ShareGrant[] | undefined,
): Promise<boolean> {
  const mapIds = await getValidShareGrantMapIds(shareGrants);
  return mapIds.length > 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, hexKey] = hash.split(":");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }
      resolve(derivedKey.toString("hex") === hexKey);
    });
  });
}
