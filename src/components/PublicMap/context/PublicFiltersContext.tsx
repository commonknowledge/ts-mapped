import { createContext } from "react";
import type { PublicMapDataRecordsQuery } from "@/__generated__/types";
import type { PublicFiltersFormValue } from "@/types";

export const PublicFiltersContext = createContext<{
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
  publicFilters: [],
  setPublicFilters: () => [],
  records: [],
  setRecords: () => [],
});
