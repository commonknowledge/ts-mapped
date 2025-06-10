import {
  DataSource,
  DataSourceResolvers as DataSourceResolversType,
} from "@/__generated__/types";
import { serializeDataSource } from "@/app/api/graphql/serializers";
import { countDataRecordsForDataSource } from "@/server/repositories/DataRecord";
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
    return dataSources.map(serializeDataSource);
  },
  recordCount: ({ id }: DataSource) => countDataRecordsForDataSource(id),
};

export default DataSourceResolvers;
