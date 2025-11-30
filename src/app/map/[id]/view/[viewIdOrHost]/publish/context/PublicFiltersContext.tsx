import { createContext } from "react";
import type { RecordGroup } from "../utils";
import type { FilterField, PublicFiltersFormValue } from "@/types";

type SetPublicFilters = React.Dispatch<
  React.SetStateAction<Record<string, PublicFiltersFormValue[]>>
>;

export const PublicFiltersContext = createContext<{
  filterFields: FilterField[];
  publicFilters: Record<string, PublicFiltersFormValue[]>;
  setPublicFilters: SetPublicFilters;
  recordGroups: RecordGroup[];
}>({
  filterFields: [],
  publicFilters: {},
  setPublicFilters: () => null,
  recordGroups: [],
});
