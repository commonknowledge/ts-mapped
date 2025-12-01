import { createContext } from "react";
import type { DataRecord } from "@/server/models/DataRecord";
import type { FilterField, PublicFiltersFormValue } from "@/types";

type SetPublicFilters = React.Dispatch<
  React.SetStateAction<Record<string, PublicFiltersFormValue[]>>
>;

export const PublicFiltersContext = createContext<{
  filterFields: FilterField[];
  publicFilters: Record<string, PublicFiltersFormValue[]>;
  setPublicFilters: SetPublicFilters;
  filteredRecords: DataRecord[];
}>({
  filterFields: [],
  publicFilters: {},
  setPublicFilters: () => null,
  filteredRecords: [],
});
