import GraphQLJSON from "graphql-type-json";
import { createSchema, createYoga, filter, pipe } from "graphql-yoga";
import { Operation } from "@/__generated__/types";
import { Resolvers } from "@/__generated__/types";
import { getServerSession } from "@/auth";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  getImportInfo,
  listDataSources,
} from "@/server/repositories/DataSource";
import pubSub from "@/server/services/pubsub";
import { getAreaStats } from "@/server/stats";
import { BoundingBox } from "@/types";
import { GraphQLContext } from "./context";
import {
  createDataSource,
  enqueueImportDataSourceJob,
  updateDataSourceConfig,
} from "./mutations";
import { serializeDataSource } from "./serializers";

const typeDefs = `
  scalar JSON

  enum ColumnType {
    empty
    boolean
    object
    number
    string
    unknown
  }

  enum ImportStatus {
    None
    Failed
    Importing
    Imported
    Pending
  }

  enum Operation {
    AVG
    SUM
  }

  input BoundingBoxInput {
    north: Float!
    east: Float!
    south: Float!
    west: Float!
  }

  input ColumnsConfigInput {
    nameColumn: String!
  }

  type AreaStat {
    areaCode: String!
    value: JSON!
  }

  type AreaStats {
    column: String!
    columnType: ColumnType!
    stats: [AreaStat!]!
  }

  type ColumnDef {
    name: String!
    type: ColumnType!
  }

  type DataSource {
    id: String!
    name: String!
    createdAt: String!
    columnDefs: [ColumnDef!]!
    config: JSON!
    columnsConfig: ColumnsConfig!
    geocodingConfig: JSON!

    importInfo: ImportInfo

    """
    markers is untyped for performance - objects are
    denormalized in the Apollo client cache, which is slow
    (and unnecessary) for 100,000+ markers.
    """
    markers: JSON

    recordCount: Int
  }

  type ColumnsConfig {
    nameColumn: String!
  }

  type ImportInfo {
    lastImported: String
    status: ImportStatus
  }

  type Query {
    areaStats(
      areaSetCode: String!
      dataSourceId: String!
      column: String!
      operation: Operation!
      excludeColumns: [String!]!
      boundingBox: BoundingBoxInput
    ): AreaStats!

    dataSource(id: String!): DataSource
    dataSources: [DataSource!]!
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
    enqueueImportDataSourceJob(dataSourceId: String!): MutationResponse!
    updateDataSourceConfig(
      id: String!
      columnsConfig: ColumnsConfigInput!
      rawGeocodingConfig: JSON!
    ): MutationResponse!
  }

  type DataSourceEvent {
    dataSourceId: String!
    importComplete: ImportCompleteEvent
    importFailed: ImportFailedEvent
    recordsImported: RecordsImportedEvent
  }

  type ImportCompleteEvent {
    at: String!
  }

  type ImportFailedEvent {
    at: String!
  }

  type RecordsImportedEvent {
    at: String!
    count: Int!
  }

  type Subscription {
    dataSourceEvent(dataSourceId: String!): DataSourceEvent!
  }
`;

const resolvers: Resolvers = {
  DataSource: {
    importInfo: ({ id }) => getImportInfo(id),
    markers: async (dataSource) => {
      const dataRecords = await findDataRecordsByDataSource(dataSource.id);
      const features = dataRecords
        .filter((dr) => dr.mappedJson.geocodeResult?.centralPoint)
        .map((dr) => {
          const centralPoint = dr.mappedJson.geocodeResult?.centralPoint;
          const coordinates = centralPoint
            ? [centralPoint.lng, centralPoint.lat]
            : []; // Will never happen because of above filter
          const nameColumn =
            dataSource?.columnsConfig.nameColumn ||
            dataSource?.columnDefs[0].name;
          return {
            type: "Feature",
            properties: {
              ...dr.json,
              [MARKER_ID_KEY]: dr.externalId,
              [MARKER_NAME_KEY]: dr.json[nameColumn],
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
  },

  Mutation: {
    createDataSource,
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

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
