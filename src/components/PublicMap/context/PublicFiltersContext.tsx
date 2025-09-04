import { createContext } from "react";
import type { PublicMapDataRecordsQuery } from "@/__generated__/types";
import type { FilterField, PublicFiltersFormValue } from "@/types";

export const PublicFiltersContext = createContext<{
  filtersDialogOpen: boolean;
  setFiltersDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filterFields: FilterField[];
  setFilterFields: React.Dispatch<React.SetStateAction<FilterField[]>>;
  publicFilters: PublicFiltersFormValue[];
  setPublicFilters: React.Dispatch<
    React.SetStateAction<PublicFiltersFormValue[]>
  >;
  records: NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"];
  setRecords: React.Dispatch<
    React.SetStateAction<
      NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"]
    >
  >;
}>({
  filtersDialogOpen: false,
  setFiltersDialogOpen: () => null,
  filterFields: [],
  setFilterFields: () => [],
  publicFilters: [],
  setPublicFilters: () => [],
  records: [],
  setRecords: () => [],
});
