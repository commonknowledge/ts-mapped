"use client";

import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { Button } from "@/shadcn/ui/button";
import { getListingSort } from "@/utils/dataRecord";
import { DATE_FILTER_OPTIONS } from "../dateFilters";
import {
  usePublicDateFilter,
  useSetPublicDateFilter,
} from "../hooks/usePublicFilters";
import type { DateFilterKey } from "../dateFilters";
import type { PublicMapColorScheme } from "@/app/(private)/map/[id]/styles";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";
import type { RouterOutputs } from "@/services/trpc/react";

export default function DateQuickFilters({
  dataSourceId,
  dataSource,
  dataSourceConfig,
  colorScheme,
}: {
  dataSourceId: string | undefined;
  dataSource: RouterOutputs["dataSource"]["byIdWithRecords"] | undefined;
  dataSourceConfig: PublicMapDataSourceConfig | undefined;
  colorScheme: PublicMapColorScheme;
}) {
  const publicDateFilter = usePublicDateFilter();
  const setPublicDateFilter = useSetPublicDateFilter();
  const { setSelectedRecords } = useInspectorState();

  const { sortBy } = getListingSort({ dataSource, dataSourceConfig });
  if (sortBy !== "date" || !dataSourceId) {
    return null;
  }

  const active = publicDateFilter[dataSourceId];

  const onSelect = (key: DateFilterKey) => {
    // Clicking the active filter again clears it.
    setPublicDateFilter({
      ...publicDateFilter,
      [dataSourceId]: active === key ? undefined : key,
    });
    setSelectedRecords([]);
  };

  return (
    <div className="flex flex-wrap gap-2 px-2 pt-2">
      {DATE_FILTER_OPTIONS.map((option) => {
        const isActive = active === option.key;
        return (
          <Button
            key={option.key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(option.key)}
            className="rounded-full shadow-none"
            style={
              isActive
                ? {
                    backgroundColor: colorScheme.primary,
                    borderColor: colorScheme.primary,
                    color: "white",
                  }
                : {
                    borderColor: colorScheme.primary,
                    color: colorScheme.primary,
                  }
            }
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
