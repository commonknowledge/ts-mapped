import GraphQLJSON from "graphql-type-json";
import { createSchema, createYoga } from "graphql-yoga";
import { getServerSession } from "@/auth";
import { applyAuthDirective } from "./auth";
import { removeTypenamePlugin } from "./plugins";
import DataSource from "./resolvers/DataSource";
import Map from "./resolvers/Map";
import Mutation from "./resolvers/Mutation";
import Query from "./resolvers/Query";
import { GraphQLDate } from "./scalars";
import typeDefs from "./typeDefs";
import type { GraphQLContext } from "./context";
import type { Resolvers } from "@/__generated__/types";
import type { NextRequest } from "next/server";

const resolvers: Resolvers = {
  Date: GraphQLDate,
  JSON: GraphQLJSON,
  DataSource,
  Query,
  Map,
  Mutation,
};

const { handleRequest } = createYoga<GraphQLContext>({
  context: async () => {
    return getServerSession();
  },

  schema: applyAuthDirective(
    createSchema({
      typeDefs,
      resolvers,
    }),
  ),

  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: "/api/graphql",

  // Yoga needs to know how to create a valid Next response
  fetchAPI: { Response },

  plugins: [removeTypenamePlugin],
});

// Return NextJS expected route handler type.
// The dummy context argument to handleRequest is replaced with the context function in createYoga.
const handleNextRequest = (request: NextRequest) =>
  handleRequest(request, { currentUser: null });

export {
  handleNextRequest as GET,
  handleNextRequest as POST,
  handleNextRequest as OPTIONS,
};
