import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  findDataSourceByIdAndOwnerId,
  findDataSourcesByIds,
  getJobInfo,
} from "@/server/repositories/DataSource";
import type {
  DataSource,
  DataSourceResolvers as DataSourceResolversType,
} from "@/__generated__/types";

const DataSourceResolvers: DataSourceResolversType = {
  // Remove sensitive credentials (leave only the `type` property)
  // if the user isn't an owner of the data source
  config: async ({ id, config }: DataSource, args, context) => {
    if (!context.currentUser) {
      return { type: config.type };
    }
    const ds = await findDataSourceByIdAndOwnerId(id, context.currentUser.id);
    if (!ds) {
      return { type: config.type };
    }
    return config;
  },
  enrichmentInfo: ({ id }: DataSource) => getJobInfo(id, "enrichDataSource"),
  importInfo: ({ id }: DataSource) => getJobInfo(id, "importDataSource"),
  enrichmentDataSources: async (dataSource: DataSource) => {
    const dataSourceIds = dataSource.enrichments
      .map((e) => e.dataSourceId)
      .filter((id) => typeof id === "string");
    const dataSources = await findDataSourcesByIds(dataSourceIds);
    return dataSources.map((ds) => ({ name: ds.name, id: ds.id }));
  },
  records: async ({ id }: DataSource, { filter, search, page, sort, all }) => {
    return findDataRecordsByDataSource(
      id,
      filter,
      search,
      page || 0,
      sort || [],
      all,
    );
  },
  recordCount: ({ id }: DataSource, { filter, search }) =>
    countDataRecordsForDataSource(id, filter, search),
};

export default DataSourceResolvers;
