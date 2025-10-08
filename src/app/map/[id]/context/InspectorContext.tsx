import { createContext } from "react";

export const InspectorContext = createContext<{
  selectedRecord: { id: string; dataSourceId: string } | null;
  setSelectedRecord: (r: { id: string; dataSourceId: string } | null) => void;
}>({
  selectedRecord: null,
  setSelectedRecord: () => null,
});
