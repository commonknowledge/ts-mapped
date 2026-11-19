import type { MapRoute } from "../atoms/mapStateAtoms";

/**
 * Whether the map is laid out as a public map (one view, the public map's
 * own data source settings and display modes): when editing a public map,
 * and on the published public map itself.
 */
export const isPublicMapLayout = (route: MapRoute) =>
  route === "publish" || route === "public";

/** Whether visitors here may have no account (they hold an access grant). */
export const isAnonymousViewerRoute = (route: MapRoute) =>
  route === "public" || route === "shared";
