import { LayoutDashboardIcon } from "lucide-react";
import { useAreaStats } from "../../data";
import { useDisplayAreaStat } from "../../hooks/useDisplayAreaStats";
import { useInspector } from "../../hooks/useInspector";
import { useMapViews } from "../../hooks/useMapViews";
import { getBoundaryDatasetName } from "./helpers";

/**
 * Single "Data used for visualisation" block: compact boundary metadata
 * (code, set) and choropleth value(s) when available. Only rendered when
 * a boundary is selected (parent only mounts this in boundary view).
 */
export default function InspectorOnMapSection() {
  const { viewConfig } = useMapViews();
  const { selectedBoundary } = useInspector();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  const hasChoropleth = Boolean(viewConfig.areaDataSourceId);
  const isSameAreaSet =
    areaStats?.areaSetCode === selectedBoundary?.areaSetCode;
  const displayAreaStat = useDisplayAreaStat(selectedBoundary);

  if (!selectedBoundary?.code || !isSameAreaSet) {
    return null;
  }

  const boundarySetName = getBoundaryDatasetName(
    selectedBoundary?.sourceLayerId,
  );

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
      <div className="mb-2 flex items-center gap-2">
        <LayoutDashboardIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Data used for visualisation
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{selectedBoundary.code}</span>
          {boundarySetName ? (
            <>
              <span className="mx-1.5">·</span>
              {boundarySetName}
            </>
          ) : null}
        </p>
        {hasChoropleth && areaStats ? (
          displayAreaStat ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {displayAreaStat.primaryLabel}
                </span>
                <span className="font-mono text-sm font-medium tabular-nums">
                  {displayAreaStat.areaToDisplay?.primaryDisplayValue}
                </span>
              </div>
              {displayAreaStat.secondaryLabel && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {displayAreaStat.secondaryLabel}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {displayAreaStat.areaToDisplay?.secondaryDisplayValue}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No value for this area
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}
