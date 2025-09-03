"use client";

import { ReactNode, useState } from "react";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import type { PublicMapDataRecordsQuery } from "@/__generated__/types";
import type { PublicFiltersFormValue } from "@/types";

export default function PublicFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [publicFilters, setPublicFilters] = useState<PublicFiltersFormValue[]>(
    [],
  );
  const [records, setRecords] = useState<
    NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"]
  >([]);

  return (
    <PublicFiltersContext
      value={{
        publicFilters,
        setPublicFilters,
        records,
        setRecords,
      }}
    >
      {children}
    </PublicFiltersContext>
  );
}
