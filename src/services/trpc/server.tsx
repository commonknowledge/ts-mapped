import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createContext } from "@/server/trpc";
import { appRouter } from "@/server/trpc/router";
import { createQueryClient } from "./queryClient";

export const createCaller = async () =>
  appRouter.createCaller(await createContext());

export const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});
