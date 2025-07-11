import {
  DataSource,
  DataSourceResolvers as DataSourceResolversType,
} from "@/__generated__/types";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  findDataSourcesByIds,
  getJobInfo,
} from "@/server/repositories/DataSource";

const DataSourceResolvers: DataSourceResolversType = {
  enrichmentInfo: ({ id }: DataSource) => getJobInfo(id, "enrichDataSource"),
  importInfo: ({ id }: DataSource) => getJobInfo(id, "importDataSource"),
  enrichmentDataSources: async (dataSource: DataSource) => {
    const dataSourceIds = dataSource.enrichments
      .map((e) => e.dataSourceId)
      .filter((id) => typeof id === "string");
    const dataSources = await findDataSourcesByIds(dataSourceIds);
    return dataSources.map((ds) => ({ name: ds.name, id: ds.id }));
  },
  records: ({ id }: DataSource) => {
    return findDataRecordsByDataSource(id);
  },
  recordCount: ({ id }: DataSource) => countDataRecordsForDataSource(id),
};

export default DataSourceResolvers;
