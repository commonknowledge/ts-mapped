import {
  BoundingBoxInput,
  CalculationType,
  QueryResolvers as QueryResolversType,
} from "@/__generated__/types";
import { GraphQLContext } from "@/app/api/graphql/context";
import {
  findDataSourceById,
  findReadableDataSources,
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
      excludeColumns,
      boundingBox,
      calculationType,
    }: {
      areaSetCode: string;
      dataSourceId: string;
      calculationType: CalculationType;
      column: string;
      excludeColumns: string[];
      boundingBox?: BoundingBoxInput | null;
    },
  ) =>
    getAreaStats(
      areaSetCode,
      dataSourceId,
      calculationType,
      column,
      excludeColumns,
      boundingBox,
    ),

  dataSource: async (_: unknown, { id }: { id: string }) => {
    const dataSource = await findDataSourceById(id);
    if (!dataSource) {
      return null;
    }
    return dataSource;
  },

  dataSources: async (
    _: unknown,
    { organisationId, includePublic },
    context: GraphQLContext,
  ) => {
    if (!context.currentUser) {
      return [];
    }
    const dataSources = await findReadableDataSources(context.currentUser.id);
    return dataSources.filter((ds) => {
      if (includePublic && ds.public) {
        return true;
      }
      if (!organisationId) {
        return true;
      }
      if (organisationId === ds.organisationId) {
        return true;
      }
      return false;
    });
  },

  map: async (_: unknown, { id }: { id: string }) => {
    const map = await findMapById(id);
    if (!map) {
      return null;
    }
    return map;
  },

  maps: async (
    _: unknown,
    { organisationId }: { organisationId?: string | null },
  ) => {
    if (!organisationId) {
      return [];
    }
    return findMapsByOrganisationId(organisationId);
  },

  organisations: async (_: unknown, args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) {
      return [];
    }
    return findOrganisationsByUserId(context.currentUser.id);
  },
};

export default QueryResolvers;
