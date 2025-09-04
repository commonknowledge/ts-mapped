import { createContext } from "react";
import type { PublicMapDataRecordsQuery } from "@/__generated__/types";
import type { PublicFiltersFormValue } from "@/types";

export const PublicFiltersContext = createContext<{
  filtersDialogOpen: boolean;
  setFiltersDialogOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
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
  publicFilters: [],
  setPublicFilters: () => [],
  records: [],
  setRecords: () => [],
});
