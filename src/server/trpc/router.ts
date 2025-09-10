import { authRouter } from "./routers/auth";
import { dataSourceRouter } from "./routers/data-source";
import { mapRouter } from "./routers/map";
import { userRouter } from "./routers/user";
import { router } from "./index";

export const appRouter = router({
  auth: authRouter,
  dataSource: dataSourceRouter,
  map: mapRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
