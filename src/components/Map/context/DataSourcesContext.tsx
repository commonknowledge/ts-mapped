import { createContext } from "react";
import { DataSourcesQuery } from "@/__generated__/types";

type DataSource = NonNullable<DataSourcesQuery["dataSources"]>[0];

export const DataSourcesContext = createContext<{
  /* State */

  dataSourcesLoading: boolean;

  /* Derived functions */
  getDataSources: () => DataSource[];
  getDataSourceById: (id: string | null | undefined) => DataSource | null;

  getChoroplethDataSource: () => DataSource | null;
  getMarkerDataSources: () => DataSource[];
  getMembersDataSource: () => DataSource | null;
}>({
  dataSourcesLoading: true,
  getDataSources: () => [],
  getDataSourceById: () => null,

  getChoroplethDataSource: () => null,
  getMarkerDataSources: () => [],
  getMembersDataSource: () => null,
});
