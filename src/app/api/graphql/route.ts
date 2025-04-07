import GraphQLJSON from "graphql-type-json";
import { createSchema, createYoga, filter, pipe } from "graphql-yoga";
import { NextRequest } from "next/server";
import { BoundingBoxInput, Operation } from "@/__generated__/types";
import { Resolvers } from "@/__generated__/types";
import { getServerSession } from "@/auth";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  findDataSourcesByIds,
  getJobInfo,
  listDataSources,
} from "@/server/repositories/DataSource";
import pubSub from "@/server/services/pubsub";
import { getAreaStats } from "@/server/stats";
import { GraphQLContext } from "./context";
import {
  createDataSource,
  enqueueEnrichDataSourceJob,
  enqueueImportDataSourceJob,
  updateDataSourceConfig,
} from "./mutations";
import { serializeDataSource } from "./serializers";
import typeDefs from "./typeDefs";

const resolvers: Resolvers = {
  JSON: GraphQLJSON,
  DataSource: {
    enrichmentInfo: ({ id }) => getJobInfo(id, "enrichDataSource"),
    importInfo: ({ id }) => getJobInfo(id, "importDataSource"),
    enrichmentDataSources: async (dataSource) => {
      const dataSourceIds = dataSource.enrichments
        .map((e) => e.dataSourceId)
        .filter((id) => typeof id === "string");
      const dataSources = await findDataSourcesByIds(dataSourceIds);
      return dataSources.map(serializeDataSource);
    },
    markers: async (dataSource) => {
      const dataRecords = await findDataRecordsByDataSource(dataSource.id);
      const features = dataRecords
        .filter((dr) => dr.geocodeResult?.centralPoint)
        .map((dr) => {
          const centralPoint = dr.geocodeResult?.centralPoint;
          const coordinates = centralPoint
            ? [centralPoint.lng, centralPoint.lat]
            : []; // Will never happen because of above filter
          const nameColumn = dataSource?.columnRoles.nameColumn;
          return {
            type: "Feature",
            properties: {
              ...dr.json,
              [MARKER_ID_KEY]: dr.externalId,
              // If no name column is specified, show the ID as the marker name instead
              [MARKER_NAME_KEY]: nameColumn
                ? dr.json[nameColumn]
                : dr.externalId,
            },
            geometry: {
              type: "Point",
              coordinates,
            },
          };
        });
      return {
        type: "FeatureCollection",
        features,
      };
    },
    recordCount: ({ id }) => countDataRecordsForDataSource(id),
  },
  Query: {
    areaStats: (
      _: unknown,
      {
        areaSetCode,
        dataSourceId,
        column,
        operation,
        excludeColumns,
        boundingBox,
      }: {
        areaSetCode: string;
        dataSourceId: string;
        column: string;
        operation: Operation;
        excludeColumns: string[];
        boundingBox?: BoundingBoxInput | null;
      },
    ) =>
      getAreaStats(
        areaSetCode,
        dataSourceId,
        column,
        operation,
        excludeColumns,
        boundingBox,
      ),

    dataSource: async (_: unknown, { id }: { id: string }, context) => {
      if (!context.currentUser) {
        return null;
      }
      const dataSource = await findDataSourceById(id);
      if (!dataSource) {
        return null;
      }
      return serializeDataSource(dataSource);
    },

    dataSources: async (_: unknown, args: unknown, context) => {
      if (!context.currentUser) {
        return [];
      }
      return (await listDataSources()).map(serializeDataSource);
    },
  },

  Mutation: {
    createDataSource,
    enqueueEnrichDataSourceJob,
    enqueueImportDataSourceJob,
    updateDataSourceConfig,
  },

  Subscription: {
    dataSourceEvent: {
      subscribe: (_: unknown, { dataSourceId }: { dataSourceId: string }) =>
        pipe(
          pubSub.subscribe("dataSourceEvent"),
          filter(
            (event) => event.dataSourceEvent.dataSourceId === dataSourceId,
          ),
        ),
    },
  },
};

const { handleRequest } = createYoga<GraphQLContext>({
  context: async () => {
    return getServerSession();
  },

  schema: createSchema({
    typeDefs,
    resolvers,
  }),

  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: "/api/graphql",

  // Yoga needs to know how to create a valid Next response
  fetchAPI: { Response },
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
