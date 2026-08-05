"use client";

import { LoaderPinwheel } from "lucide-react";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { DUMMY_COUNT_COLUMN } from "@/constants";
import { useChoroplethDataSource } from "@/hooks/useDataSources";
import { AreaSetGroupCodeLabels } from "@/labels";
import { useColorScheme } from "../../colors";
import { useAreaStats } from "../../data";
import BivariateLegend from "../BivariateLagend";
import { LegendBars } from "./LegendBars";

/**
 * Display-only legend for the read-only shared map page: the choropleth
 * colour bars and their labels, with none of the editor `Legend`'s data
 * source / column / boundary configuration controls.
 */
export default function LegendDisplay() {
  const { viewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const isLoading = areaStatsQuery?.isFetching;

  const colorScheme = useColorScheme({
    areaStats,
    viewConfig,
  });

  const hasColumn = Boolean(viewConfig.areaDataColumn);
  if (!viewConfig.areaDataSourceId || !hasColumn) {
    return null;
  }

  const isCount = viewConfig.areaDataColumn === DUMMY_COUNT_COLUMN;
  const isBivariate = Boolean(
    !isCount && viewConfig.areaDataColumn && viewConfig.areaDataSecondaryColumn,
  );

  const columnLabel = isCount
    ? "Count of records"
    : viewConfig.areaDataColumn || "";
  const boundaryLabel = viewConfig.areaSetGroupCode
    ? AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode]
    : null;

  return (
    <div className="flex flex-col rounded-sm bg-white border border-neutral-200 w-full shadow-sm">
      <div className="flex flex-col gap-0.5 p-2 pb-1">
        <p className="text-xs font-semibold truncate">{columnLabel}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {dataSource?.name}
          {boundaryLabel ? ` · ${boundaryLabel}` : ""}
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center px-3 py-4">
          <LoaderPinwheel className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : isBivariate ? (
        <div className="px-2 pb-2">
          <BivariateLegend />
        </div>
      ) : colorScheme ? (
        <div className="flex px-2 pb-2">
          <LegendBars
            colorScheme={colorScheme}
            viewConfig={viewConfig}
            areaStats={areaStats}
            dataSource={dataSource}
          />
        </div>
      ) : null}
    </div>
  );
}
