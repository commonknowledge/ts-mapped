import { createContext } from "react";

export const DataRecordContext = createContext<{
  selectedDataRecord: { id: string; dataSourceId: string } | null;
  setSelectedDataRecord: (
    r: { id: string; dataSourceId: string } | null,
  ) => void;
}>({
  selectedDataRecord: null,
  setSelectedDataRecord: () => null,
});
