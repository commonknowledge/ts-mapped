import { randomBytes, scrypt } from "crypto";
import { findOrganisationForUser } from "@/server/repositories/Organisation";
import { findPublishedPublicMapByDataSourceId } from "@/server/repositories/PublicMap";

/**
 * Checks whether a user can read a data source.
 * A data source is readable if:
 * 1. It is public, or
 * 2. It appears on a published public map, or
 * 3. The user belongs to the data source's organisation.
 */
export async function canReadDataSource(
  dataSource: { id: string; public: boolean; organisationId: string },
  userId: string | null | undefined,
): Promise<boolean> {
  if (dataSource.public) {
    return true;
  }

  const publicMap = await findPublishedPublicMapByDataSourceId(dataSource.id);
  if (publicMap) {
    return true;
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
