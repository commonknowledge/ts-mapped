"use client";

import { HttpLink } from "@apollo/client";
import {
  ApolloLink,
  FetchResult,
  Observable,
  Operation,
  split,
} from "@apollo/client/core";
import { getMainDefinition } from "@apollo/client/utilities";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";
import { print } from "graphql";
import {
  Client,
  ClientOptions,
  ExecutionResult,
  createClient,
} from "graphql-sse";
import { useContext } from "react";
import { AreaStat, AreaStats } from "@/__generated__/types";
import { ServerSessionContext } from "./ServerSessionProvider";

class SSELink extends ApolloLink {
  private client: Client;

  constructor(options: ClientOptions) {
    super();
    this.client = createClient(options);
  }

  public request(
    operation: Operation,
  ): Observable<ExecutionResult<FetchResult>> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        },
      );
    });
  }
}

function makeClient(jwt: string | null) {
  const uri = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/graphql`;

  const httpLink = new HttpLink({
    uri,
    headers: {
      cookie: `JWT=${jwt || ""}`,
    },
  });

  const sseLink = new SSELink({
    url: uri,
    headers: {
      cookie: `JWT=${jwt || ""}`,
    },
  });

  // Send subscriptions over SSE, everything else over HTTP
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    sseLink,
    httpLink,
  );

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        // This policy has to be on the Query for areaStats().fetchMore() to work
        Query: {
          fields: {
            areaStats: {
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
              merge: (
                existing: AreaStats | undefined,
                incoming: AreaStats | undefined,
                cache,
              ): AreaStats | undefined => {
                const result = incoming || existing;
                if (!result) {
                  return;
                }

                const allData = [
                  ...(existing?.stats || []),
                  ...(incoming?.stats || []),
                ];
                const deduped: Record<string, AreaStat> = {};
                for (const d of allData) {
                  const areaCode = cache.isReference(d)
                    ? cache.readField("areaCode", d)
                    : d.areaCode;
                  if (typeof areaCode === "string") {
                    deduped[areaCode] = d;
                  }
                }
                const stats = Object.values(deduped);
                // Have to return a new object
                return { ...result, stats };
              },
            },
          },
        },
      },
    }),
    link: splitLink,
  });
}

export default function ApolloProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { jwt } = useContext(ServerSessionContext);
  return (
    <ApolloNextAppProvider makeClient={() => makeClient(jwt)}>
      {children}
    </ApolloNextAppProvider>
  );
}
