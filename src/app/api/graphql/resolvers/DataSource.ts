import {
  DataSource,
  DataSourceResolvers as DataSourceResolversType,
} from "@/__generated__/types";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  findDataSourceByIdAndOwnerId,
  findDataSourcesByIds,
  getJobInfo,
} from "@/server/repositories/DataSource";

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
  records: ({ id }: DataSource, { filter, page, sort }) => {
    return findDataRecordsByDataSource(id, filter, page || 0, sort || []);
  },
  recordCount: ({ id }: DataSource, { filter }) =>
    countDataRecordsForDataSource(id, filter),
};

export default DataSourceResolvers;
