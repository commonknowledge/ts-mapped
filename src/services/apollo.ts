import { HttpLink, from } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/experimental-nextjs-app-support";
import { getServerSession } from "@/auth";
import { DEV_NEXT_PUBLIC_BASE_URL } from "@/constants";
import { createSentryErrorLink } from "@/utils/apollo";

export const { getClient, query, PreloadQuery } = registerApolloClient(
  async () => {
    const { jwt } = await getServerSession();
    const httpLink = new HttpLink({
      uri: `${
        process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL
      }/api/graphql`,
      headers: {
        cookie: `JWT=${jwt || ""}`,
      },
    });
    return new ApolloClient({
      cache: new InMemoryCache(),
      // Don't throw exceptions on errors, instead use the { errors }
      // property of the result. Exceptions in components lead to
      // complicated code.
      defaultOptions: {
        watchQuery: {
          errorPolicy: "all", // for useQuery
        },
        query: {
          errorPolicy: "all", // for client.query()
        },
        mutate: {
          errorPolicy: "all", // for client.mutate()
        },
      },
      link: from([createSentryErrorLink(), httpLink]),
    });
  },
);
