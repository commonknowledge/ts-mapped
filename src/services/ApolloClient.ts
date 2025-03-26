import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/experimental-nextjs-app-support";
import { getServerSession } from "@/auth";

export const { getClient, query, PreloadQuery } = registerApolloClient(
  async () => {
    const { jwt } = await getServerSession();
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: `${
          process.env.BACKEND_URL || "http://localhost:3000"
        }/api/graphql`,
        headers: {
          cookie: `JWT=${jwt || ""}`,
        },
      }),
    });
  }
);
