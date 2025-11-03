import { createContext } from "react";
import type { RouterOutputs } from "@/services/trpc/react";
import type { FilterField, PublicFiltersFormValue } from "@/types";

export const PublicFiltersContext = createContext<{
  filterFields: FilterField[];
  setFilterFields: React.Dispatch<React.SetStateAction<FilterField[]>>;
  publicFilters: Record<string, PublicFiltersFormValue[]>;
  setPublicFilters: (r: Record<string, PublicFiltersFormValue[]>) => void;
  records: NonNullable<
    RouterOutputs["dataSource"]["byIdWithRecords"]
  >["records"];
  setRecords: React.Dispatch<
    React.SetStateAction<
      NonNullable<RouterOutputs["dataSource"]["byIdWithRecords"]>["records"]
    >
  >;
}>({
  filterFields: [],
  setFilterFields: () => [],
  publicFilters: {},
  setPublicFilters: () => null,
  records: [],
  setRecords: () => [],
});
