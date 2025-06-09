import {
  DataSource,
  DataSourceResolvers as DataSourceResolversType,
} from "@/__generated__/types";
import { serializeDataSource } from "@/app/api/graphql/serializers";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
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
    return dataSources.map(serializeDataSource);
  },
  markers: async (dataSource: DataSource) => {
    const dataRecords = await findDataRecordsByDataSource(dataSource.id);
    const features = dataRecords
      .filter((dr) => dr.geocodeResult?.centralPoint)
      .map((dr) => {
        const centralPoint = dr.geocodeResult?.centralPoint;
        const coordinates = centralPoint
          ? [centralPoint.lng, centralPoint.lat]
          : []; // Will never happen because of above filter
        const nameColumn = dataSource?.columnRoles.nameColumn;
        return {
          type: "Feature",
          properties: {
            ...dr.json,
            [MARKER_ID_KEY]: dr.externalId,
            // If no name column is specified, show the ID as the marker name instead
            [MARKER_NAME_KEY]: nameColumn ? dr.json[nameColumn] : dr.externalId,
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
  recordCount: ({ id }: DataSource) => countDataRecordsForDataSource(id),
};

export default DataSourceResolvers;
