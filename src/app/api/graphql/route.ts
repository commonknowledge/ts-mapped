import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import GraphQLJSON from "graphql-type-json";
import { NextRequest } from "next/server";
import { Operation } from "@/__generated__/types";
import { Resolvers } from "@/__generated__/types";
import { getServerSession } from "@/auth";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  listDataSources,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { getAreaStats } from "@/server/stats";
import { BoundingBox } from "@/types";
import {
  createDataSource,
  triggerImportDataSourceJob,
  updateGeocodingConfig,
} from "./mutations";
import { serializeDataSource } from "./serializers";

const typeDefs = gql`
  scalar JSON

  type AreaStat {
    areaCode: String!
    value: JSON!
  }

  type AreaStats {
    column: String!
    columnType: ColumnType!
    stats: [AreaStat!]!
  }

  input BoundingBox {
    north: Float!
    east: Float!
    south: Float!
    west: Float!
  }

  type ColumnDef {
    name: String!
    type: ColumnType!
  }

  enum ColumnType {
    empty
    boolean
    object
    number
    string
    unknown
  }

  type DataSource {
    id: String!
    name: String!
    createdAt: String!
    columnDefs: [ColumnDef!]!
    config: JSON!
    geocodingConfig: JSON!
    recordCount: Int
  }

  enum Operation {
    AVG
    SUM
  }

  type Query {
    areaStats(
      areaSetCode: String!
      dataSourceId: String!
      column: String!
      operation: Operation!
      excludeColumns: [String!]!
      boundingBox: BoundingBox
    ): AreaStats!

    dataSource(id: String!): DataSource
    dataSources: [DataSource!]!

    """
    markers is untyped for performance - objects are
    denormalized in the Apollo client cache, which is slow
    (and unnecessary) for 100,000+ markers.
    """
    markers(dataSourceId: String!): JSON!
  }

  type CreateDataSourceResponse {
    code: Int!
    result: DataSource
  }

  type MutationResponse {
    code: Int!
  }

  type Mutation {
    createDataSource(name: String!, rawConfig: JSON!): CreateDataSourceResponse!
    triggerImportDataSourceJob(dataSourceId: String!): MutationResponse!
    updateGeocodingConfig(
      id: String!
      rawGeocodingConfig: JSON!
    ): MutationResponse!
  }
`;

const resolvers: Resolvers = {
  DataSource: {
    recordCount: ({ id }) => countDataRecordsForDataSource(id),
  },
  JSON: GraphQLJSON,
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
        boundingBox?: BoundingBox | null;
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

    markers: async (_: unknown, { dataSourceId }: { dataSourceId: string }) => {
      const dataRecords = await findDataRecordsByDataSource(dataSourceId);
      const features = dataRecords
        .filter((dr) => dr.mappedJson.geocodeResult?.centralPoint)
        .map((dr) => {
          const centralPoint = dr.mappedJson.geocodeResult?.centralPoint;
          const coordinates = centralPoint
            ? [centralPoint.lng, centralPoint.lat]
            : []; // Will never happen because of above filter
          return {
            type: "Feature",
            properties: dr.json,
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
  },

  Mutation: {
    createDataSource,
    triggerImportDataSourceJob,
    updateGeocodingConfig,
  },
};

const server = new ApolloServer({
  resolvers,
  typeDefs,
  formatError: (formattedError, error) => {
    logger.error(`GraphQL error: ${error}`);
    return formattedError;
  },
});

const handler = startServerAndCreateNextHandler(server, {
  context: async () => {
    const { currentUser } = await getServerSession();
    return { currentUser };
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
