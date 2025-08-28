import { createContext } from "react";
import { DataSourcesQuery } from "@/__generated__/types";
import { RouterOutputs } from "@/lib/trpc";

type DataSource = NonNullable<DataSourcesQuery["dataSources"]>[0];

export const DataSourcesContext = createContext<{
  /* State */

  dataSourcesLoading: boolean;

  /* Derived functions */
  dataSources: RouterOutputs["dataSource"]["all"];
  getDataSourceById: (id: string) => DataSource | null;

  // getChoroplethDataSource: () => DataSource | null;
  // getMarkerDataSources: () => DataSource[];
  // getMembersDataSource: () => DataSource | null;
}>({
  dataSourcesLoading: true,
  dataSources: [],
  getDataSourceById: () => null,

  // getChoroplethDataSource: () => null,
  // getMarkerDataSources: () => [],
  // getMembersDataSource: () => null,
});
