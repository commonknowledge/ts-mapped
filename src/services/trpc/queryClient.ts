import {
  QueryCache,
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import superjson from "superjson";
import { UNAUTHORIZED_MESSAGE } from "@/constants";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Manually invalidate queries if they need to be refetched
        staleTime: Infinity,
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
      mutations: {
        onError: (error) => {
          if (error.message.includes(UNAUTHORIZED_MESSAGE)) {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (error.message.includes(UNAUTHORIZED_MESSAGE)) {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }
      },
    }),
  });
}
