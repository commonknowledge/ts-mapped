import { areaRouter } from "./routers/area";
import { authRouter } from "./routers/auth";
import { dataRecordRouter } from "./routers/dataRecord";
import { dataSourceRouter } from "./routers/dataSource";
import { folderRouter } from "./routers/folder";
import { mapRouter } from "./routers/map";
import { mapViewRouter } from "./routers/mapView";
import { organisationRouter } from "./routers/organisation";
import { placedMarkerRouter } from "./routers/placedMarker";
import { publicMapRouter } from "./routers/publicMap";
import { turfRouter } from "./routers/turf";
import { userRouter } from "./routers/user";
import { router } from "./index";

export const appRouter = router({
  auth: authRouter,
  area: areaRouter,
  dataRecord: dataRecordRouter,
  dataSource: dataSourceRouter,
  map: mapRouter,
  folder: folderRouter,
  placedMarker: placedMarkerRouter,
  turf: turfRouter,
  mapView: mapViewRouter,
  organisation: organisationRouter,
  publicMap: publicMapRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
