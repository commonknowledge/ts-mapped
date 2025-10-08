import "server-only";

import { createContext } from "@/server/trpc";
import { appRouter } from "@/server/trpc/router";

export const createCaller = async () =>
  appRouter.createCaller(await createContext());
