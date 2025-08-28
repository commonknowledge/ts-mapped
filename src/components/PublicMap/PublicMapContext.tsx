import { QueryResult } from "@apollo/client";
import { createContext } from "react";
import {
  PublicMap,
  PublicMapColumn,
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
  PublicMapDataSourceConfig,
  PublishedPublicMapQuery,
} from "@/__generated__/types";
import { Point } from "@/types";

export const PublicMapContext = createContext<{
  publicMap: PublishedPublicMapQuery["publishedPublicMap"];
  editable: boolean;
  dataRecordsQueries: Record<
    string,
    QueryResult<PublicMapDataRecordsQuery, PublicMapDataRecordsQueryVariables>
  >;
  searchLocation: Point | null;
  setSearchLocation: (p: Point | null) => void;
  updatePublicMap: (publicMap: Partial<PublicMap>) => void;
  updateDataSourceConfig: (
    dataSourceId: string,
    config: Partial<PublicMapDataSourceConfig>
  ) => void;
  updateAdditionalColumn: (
    dataSourceId: string,
    columnIndex: number,
    config: Partial<PublicMapColumn>
  ) => void;
  activeTabId: string | null;
  setActiveTabId: (tabId: string | null) => void;
  activePublishTab: string;
  setActivePublishTab: (tab: string) => void;
  recordSidebarVisible: boolean;
  setRecordSidebarVisible: (visible: boolean) => void;
  colourScheme: string;
  setColourScheme: (scheme: string) => void;
  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;
}>({
  publicMap: null,
  editable: false,
  dataRecordsQueries: {},
  searchLocation: null,
  setSearchLocation: () => null,
  updatePublicMap: () => null,
  updateDataSourceConfig: () => null,
  updateAdditionalColumn: () => null,
  activeTabId: null,
  setActiveTabId: () => null,
  activePublishTab: "settings",
  setActivePublishTab: () => null,
  recordSidebarVisible: false,
  setRecordSidebarVisible: () => null,
  colourScheme: "red",
  setColourScheme: () => null,
  selectedRecordId: null,
  setSelectedRecordId: () => null,
});
