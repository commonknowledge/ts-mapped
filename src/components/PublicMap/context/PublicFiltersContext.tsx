import { createContext } from "react";

export const PublicFiltersContext = createContext<{
  publicFilters: object[];
  setPublicFilters: React.Dispatch<React.SetStateAction<object[]>>;
}>({
  publicFilters: [],
  setPublicFilters: () => [],
});
