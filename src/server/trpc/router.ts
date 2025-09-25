import { areaRouter } from "./routers/area";
import { authRouter } from "./routers/auth";
import { dataSourceRouter } from "./routers/data-source";
import { folderRouter } from "./routers/folder";
import { mapRouter } from "./routers/map";
import { mapViewRouter } from "./routers/map-view";
import { organisationRouter } from "./routers/organisation";
import { placedMarkerRouter } from "./routers/placed-marker";
import { publicMapRouter } from "./routers/public-map";
import { turfRouter } from "./routers/turf";
import { userRouter } from "./routers/user";
import { router } from "./index";

export const appRouter = router({
  auth: authRouter,
  dataSource: dataSourceRouter,
  area: areaRouter,
  map: mapRouter,
  publicMap: publicMapRouter,
  folder: folderRouter,
  placedMarker: placedMarkerRouter,
  turf: turfRouter,
  mapView: mapViewRouter,
  organisation: organisationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
