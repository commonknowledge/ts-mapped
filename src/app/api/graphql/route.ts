import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import GraphQLJSON from "graphql-type-json";
import { NextRequest } from "next/server";
import { getServerSession } from "@/auth";
import { ColumnType } from "@/server/models/DataSource";
import { findDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  listDataSources,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { Operation, getAreaStats } from "@/server/stats";
import { BoundingBox, CurrentUser } from "@/types";
import { createDataSource, triggerImportDataSourceJob } from "./mutations";

interface GraphQLContext {
  currentUser: CurrentUser | null;
}

const typeDefs = gql`
  scalar JSON

  type AreaStat {
    areaCode: String!
    value: JSON!
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
    ${Object.keys(ColumnType).join(", ")}
  }

  type DataSource {
    id: String!
    name: String!
    columnDefs: [ColumnDef!]!
    config: JSON!
    createdAt: String!
  }

  type GeoJSON {
    type: String!
    features: [GeoJSONFeature!]!
  }

  type GeoJSONFeature {
    properties: JSON
    geometry: GeoJSONGeometry
  }

  type GeoJSONGeometry {
    type: String!
    coordinates: [Float!]!
  }

  enum Operation {
    ${Object.keys(Operation).join(", ")}
  }

  type Query {
    areaStats(
      areaSetCode: String!,
      dataSourceId: String!,
      column: String!,
      operation: Operation!,
      excludeColumns: [String!]!
      boundingBox: BoundingBox
    ): [AreaStat]!
    dataSource: DataSource!
    dataSources: [DataSource!]!
    markers(dataSourceId: String!): GeoJSON!
  }

  type CreateDataSourceResponse {
    code: Int!
    result: DataSource
  }

  type MutationResponse {
    code: Int!
  }

  type Mutation {
    createDataSource(name: String!, rawConfig: JSON!, rawGeocodingConfig: JSON!): CreateDataSourceResponse!
    triggerImportDataSourceJob(dataSourceId: String!): MutationResponse!
  }
`;

const resolvers = {
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
        boundingBox?: BoundingBox;
      }
    ) =>
      getAreaStats(
        areaSetCode,
        dataSourceId,
        column,
        operation,
        excludeColumns,
        boundingBox
      ),

    dataSource: (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.currentUser) {
        return [];
      }
      return findDataSourceById(id);
    },
    dataSources: (_: unknown, args: unknown, context: GraphQLContext) => {
      if (!context.currentUser) {
        return [];
      }
      return listDataSources();
    },
    markers: async (_: unknown, { dataSourceId }: { dataSourceId: string }) => {
      const dataRecords = await findDataRecordsByDataSource(dataSourceId);
      const features = dataRecords
        .filter((dr) => dr.mappedJson.geocodeResult?.centralPoint)
        .map((dr) => {
          const centralPoint = dr.mappedJson.geocodeResult?.centralPoint;
          const coordinates = centralPoint
            ? [centralPoint.lng, centralPoint.lat]
            : null;
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
        features
      }
    },
  },
  Mutation: {
    createDataSource,
    triggerImportDataSourceJob,
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
  context: async (): Promise<GraphQLContext> => {
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
