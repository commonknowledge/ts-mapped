import { QueryResult } from "@apollo/client";
import { createContext } from "react";
import {
  PublicMap,
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
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
}>({
  publicMap: null,
  editable: false,
  dataRecordsQueries: {},
  searchLocation: null,
  setSearchLocation: () => null,
  updatePublicMap: () => null,
});
