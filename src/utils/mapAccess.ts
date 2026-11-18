import { MAP_ACCESS_TOKEN_PARAM } from "@/constants";
import { getAbsoluteUrl } from "./appUrl";
import type { MapAccess, MapAccessTargetRef } from "@/models/MapAccess";

export const mapAccessTargetColumn = (target: MapAccessTargetRef) =>
  target.kind === "publicMap" ? "publicMapId" : "mapShareId";

/** The target an access row is for, read from whichever id it has. */
export function getMapAccessTargetRef(
  access: Pick<MapAccess, "publicMapId" | "mapShareId">,
): MapAccessTargetRef | null {
  if (access.publicMapId) {
    return { kind: "publicMap", id: access.publicMapId };
  }
  if (access.mapShareId) {
    return { kind: "mapShare", id: access.mapShareId };
  }
  return null;
}

/** The address of a shared map, with a magic link token if given. */
export function buildMapShareAccessLink({
  shareToken,
  token,
}: {
  shareToken: string;
  token?: string;
}): string {
  const url = new URL(getAbsoluteUrl(`share/${shareToken}`));
  if (token) {
    url.searchParams.set(MAP_ACCESS_TOKEN_PARAM, token);
  }
  return url.toString();
}
