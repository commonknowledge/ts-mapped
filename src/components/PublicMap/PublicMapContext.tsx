import { QueryResult } from "@apollo/client";
import { createContext } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
  PublishedPublicMapQuery,
} from "@/__generated__/types";
import { Point } from "@/types";

export const PublicMapContext = createContext<{
  publicMap: PublishedPublicMapQuery["publishedPublicMap"];
  dataRecordsQueries: Record<
    string,
    QueryResult<PublicMapDataRecordsQuery, PublicMapDataRecordsQueryVariables>
  >;
  searchLocation: Point | null;
  setSearchLocation: (p: Point | null) => void;
}>({
  publicMap: null,
  dataRecordsQueries: {},
  searchLocation: null,
  setSearchLocation: () => null,
});
