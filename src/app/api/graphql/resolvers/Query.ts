import {
  findDataSourceById,
  findReadableDataSources,
} from "@/server/repositories/DataSource";
import {
  findMapById,
  findMapsByOrganisationId,
} from "@/server/repositories/Map";
import { findOrganisationsByUserId } from "@/server/repositories/Organisation";
import {
  findPublicMapByHost,
  findPublicMapByViewId,
} from "@/server/repositories/PublicMap";
import { getAreaStats } from "@/server/stats";
import type {
  BoundingBoxInput,
  CalculationType,
  QueryResolvers as QueryResolversType,
} from "@/__generated__/types";
import type { GraphQLContext } from "@/app/api/graphql/context";

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
    const dataSources = await findReadableDataSources(context.currentUser?.id);
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

  publicMap: async (_: unknown, { viewId }: { viewId: string }) => {
    const publicMap = await findPublicMapByViewId(viewId);
    if (!publicMap) {
      return null;
    }
    return publicMap;
  },

  publishedPublicMap: async (_: unknown, { host }: { host: string }) => {
    const publicMap = await findPublicMapByHost(host);
    if (!publicMap?.published) {
      return null;
    }
    return publicMap;
  },
};

export default QueryResolvers;
