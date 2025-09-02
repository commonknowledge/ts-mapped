"use client";

import { ReactNode, useState } from "react";
import { PublicFiltersContext } from "../context/PublicFiltersContext";

export default function PublicFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [publicFilters, setPublicFilters] = useState<object[]>([]);

  return (
    <PublicFiltersContext
      value={{
        publicFilters,
        setPublicFilters,
      }}
    >
      {children}
    </PublicFiltersContext>
  );
}
