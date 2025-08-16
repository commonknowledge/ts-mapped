"use client";

import { ReactNode } from "react";
import { PublishedPublicMapQuery } from "@/__generated__/types";
import { PublicMapContext } from "./PublicMapContext";

export default function PublicMapProvider({
  publicMap,
  children,
}: {
  publicMap: PublishedPublicMapQuery["publishedPublicMap"];
  children: ReactNode;
}) {
  return <PublicMapContext value={{ publicMap }}>{children}</PublicMapContext>;
}
