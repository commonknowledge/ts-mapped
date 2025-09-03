import { createContext } from "react";
import type { PublicFiltersFormValue } from "@/types";

export const PublicFiltersContext = createContext<{
  publicFilters: object[];
  setPublicFilters: React.Dispatch<
    React.SetStateAction<PublicFiltersFormValue[]>
  >;
}>({
  publicFilters: [],
  setPublicFilters: () => [],
});
