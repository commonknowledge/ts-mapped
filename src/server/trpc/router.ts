import { authRouter } from "./routers/auth";
import { dataSourceRouter } from "./routers/data-source";
import { mapRouter } from "./routers/map";
import { mapViewRouter } from "./routers/mapView";
import { organisationRouter } from "./routers/organisation";
import { userRouter } from "./routers/user";
import { router } from "./index";

export const appRouter = router({
  auth: authRouter,
  dataSource: dataSourceRouter,
  map: mapRouter,
  mapView: mapViewRouter,
  organisation: organisationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
