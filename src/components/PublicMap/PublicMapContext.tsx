import { createContext } from "react";
import { PublishedPublicMapQuery } from "@/__generated__/types";

export const PublicMapContext = createContext<{
  publicMap: PublishedPublicMapQuery["publishedPublicMap"];
}>({
  publicMap: null,
});
