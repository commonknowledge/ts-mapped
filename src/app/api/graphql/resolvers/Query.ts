import {
  BoundingBoxInput,
  Operation,
  QueryResolvers as QueryResolversType,
} from "@/__generated__/types";
import { GraphQLContext } from "@/app/api/graphql/context";
import {
  serializeDataSource,
  serializeMap,
} from "@/app/api/graphql/serializers";
import {
  findDataSourceById,
  findDataSourcesByUserId,
} from "@/server/repositories/DataSource";
import {
  findMapById,
  findMapsByOrganisationId,
} from "@/server/repositories/Map";
import { findOrganisationsByUserId } from "@/server/repositories/Organisation";
import { getAreaStats } from "@/server/stats";

const QueryResolvers: QueryResolversType = {
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

  dataSource: async (_: unknown, { id }: { id: string }) => {
    const dataSource = await findDataSourceById(id);
    if (!dataSource) {
      return null;
    }
    return serializeDataSource(dataSource);
  },

  dataSources: async (
    _: unknown,
    { organisationId }: { organisationId?: string | null },
    context: GraphQLContext,
  ) => {
    if (!context.currentUser) {
      return [];
    }
    const dataSources = await findDataSourcesByUserId(context.currentUser.id);
    return dataSources
      .filter((ds) => !organisationId || ds.organisationId === organisationId)
      .map(serializeDataSource);
  },

  map: async (_: unknown, { id }: { id: string }) => {
    const map = await findMapById(id);
    if (!map) {
      return null;
    }
    return serializeMap(map);
  },

  maps: async (
    _: unknown,
    { organisationId }: { organisationId?: string | null },
  ) => {
    if (!organisationId) {
      return [];
    }
    const maps = await findMapsByOrganisationId(organisationId);
    return maps.map(serializeMap);
  },

  organisations: async (_: unknown, args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) {
      return [];
    }
    return findOrganisationsByUserId(context.currentUser.id);
  },
};

export default QueryResolvers;
