"use client";

import { ReactNode, useState } from "react";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import type { PublicFiltersFormValue } from "@/types";

export default function PublicFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [publicFilters, setPublicFilters] = useState<PublicFiltersFormValue[]>(
    [],
  );

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
