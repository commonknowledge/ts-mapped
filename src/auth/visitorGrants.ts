import { getPublicMapAccessGrants } from "./publicMapAccessGrants";
import { getShareGrants } from "./shareGrants";
import type { VisitorGrants } from "@/authTypes";

/** All the grants carried by the current request's cookies. */
export async function getVisitorGrants(): Promise<VisitorGrants> {
  const [share, publicMapAccess] = await Promise.all([
    getShareGrants(),
    getPublicMapAccessGrants(),
  ]);
  return { share, publicMapAccess };
}
