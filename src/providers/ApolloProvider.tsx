"use client";

import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";
import { useContext } from "react";
import { ServerSessionContext } from "./ServerSessionProvider";

function makeClient(jwt: string | null) {
  const httpLink = new HttpLink({
    uri: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/graphql`,
    headers: {
      cookie: `JWT=${jwt || ''}`
    }
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        AreaStats: {
          fields: {
            stats: {
              // Use all argument values except boundingBox
              // so results for different bounding boxes are merged.
              keyArgs: (args) => {
                if (!args) {
                  return "";
                }
                let fullKey = "";
                for (const key of Object.keys(args)) {
                  if (key === "boundingBox") {
                    continue;
                  }
                  const value = args[key];
                  fullKey += `${key}:${JSON.stringify(value)};`;
                }
                return fullKey;
              },
              // Merge and deduplicate stats for areas in different bounding boxes
              merge: (existing, incoming, cache) => {
                const allData = [...(existing || []), ...(incoming || [])];
                const deduped: Record<string, unknown> = {};
                for (const d of allData) {
                  const areaCode = cache.isReference(d)
                    ? cache.readField("areaCode", d)
                    : d.areaCode;
                  deduped[areaCode] = d;
                }
                return Object.values(deduped);
              },
            },
          },
        },
      },
    }),
    link: httpLink,
  });
}

export default function ApolloProvider({ children }: { children: React.ReactNode }) {
  const { jwt } = useContext(ServerSessionContext)
  return (
    <ApolloNextAppProvider makeClient={() => makeClient(jwt)}>
      {children}
    </ApolloNextAppProvider>
  );
}
