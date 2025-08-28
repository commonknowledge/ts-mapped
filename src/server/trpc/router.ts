import { authRouter } from "./routers/auth";
import { dataSourceRouter } from "./routers/data-source";
import { userRouter } from "./routers/user";
import { router } from "./index";

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  dataSource: dataSourceRouter,
});

export type AppRouter = typeof appRouter;
