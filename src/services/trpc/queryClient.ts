import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import superjson from "superjson";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Manually invalidate queries if they need to be refetched
        staleTime: Infinity,
        retry: (failureCount, error) => {
          if (
            error instanceof TRPCClientError &&
            error.data?.httpStatus === 404
          ) {
            return false;
          }
          return failureCount < 3;
        },
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
