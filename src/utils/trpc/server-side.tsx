import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cache } from "react";
// import { type AppRouter, appRouter } from "@/server/trpc/router";
import { makeQueryClient } from "./query-client";
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";

const getQueryClient = cache(makeQueryClient);

// export const trpc = createTRPCOptionsProxy<AppRouter>({
//   router: appRouter,
//   ctx: createContext,
//   queryClient: getQueryClient,
// });

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
