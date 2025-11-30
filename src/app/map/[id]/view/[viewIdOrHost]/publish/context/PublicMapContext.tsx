import { createContext } from "react";
import type {
  PublicMap,
  PublicMapColumn,
  PublicMapDataSourceConfig,
} from "@/server/models/PublicMap";
import type { Point } from "@/server/models/shared";
import type { RouterOutputs } from "@/services/trpc/react";

export const PublicMapContext = createContext<{
  publicMap: RouterOutputs["publicMap"]["getPublished"];
  editable: boolean;
  searchLocation: Point | null;
  setSearchLocation: (p: Point | null) => void;
  updatePublicMap: (publicMap: Partial<PublicMap>) => void;
  updateDataSourceConfig: (
    dataSourceId: string,
    config: Partial<PublicMapDataSourceConfig>,
  ) => void;
  updateAdditionalColumn: (
    dataSourceId: string,
    columnIndex: number,
    config: Partial<PublicMapColumn>,
  ) => void;
  activeTabId: string | null;
  setActiveTabId: (tabId: string | null) => void;
  activePublishTab: string;
  setActivePublishTab: (tab: string) => void;
  colorScheme: string;
  selectedRecordGroupId: string | null;
  setSelectedRecordGroupId: (id: string) => void;
}>({
  publicMap: null,
  editable: false,
  searchLocation: null,
  setSearchLocation: () => null,
  updatePublicMap: () => null,
  updateDataSourceConfig: () => null,
  updateAdditionalColumn: () => null,
  activeTabId: null,
  setActiveTabId: () => null,
  activePublishTab: "settings",
  setActivePublishTab: () => null,
  colorScheme: "red",
  selectedRecordGroupId: null,
  setSelectedRecordGroupId: () => null,
});
