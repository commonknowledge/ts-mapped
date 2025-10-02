import { areaStatsRouter } from "./routers/areaStats";
import { authRouter } from "./routers/auth";
import { dataRecordRouter } from "./routers/dataRecord";
import { dataSourceRouter } from "./routers/dataSource";
import { mapRouter } from "./routers/map";
import { mapViewRouter } from "./routers/mapView";
import { organisationRouter } from "./routers/organisation";
import { publicMapRouter } from "./routers/publicMap";
import { userRouter } from "./routers/user";
import { router } from "./index";

export const appRouter = router({
  auth: authRouter,
  areaStats: areaStatsRouter,
  dataRecord: dataRecordRouter,
  dataSource: dataSourceRouter,
  map: mapRouter,
  mapView: mapViewRouter,
  organisation: organisationRouter,
  publicMap: publicMapRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
