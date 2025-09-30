import { createContext } from "react";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource = RouterOutputs["dataSource"]["listReadable"][number];

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
