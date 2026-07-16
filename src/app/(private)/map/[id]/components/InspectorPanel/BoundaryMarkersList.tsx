import { LoaderPinwheel } from "lucide-react";

import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { ColumnType } from "@/models/DataSource";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useBoundaryMarkers } from "../../hooks/useBoundaryMarkers";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import MarkerCountsChart from "./MarkerCountsChart";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";
import type { DataSource } from "@/models/DataSource";
import type { MarkerFeature } from "@/types";

const NONE_VALUE = "__none__";

export default function BoundaryMarkersList() {
  const { selectedBoundary } = useInspectorState();
  const {
    areaDataLoading,
    members,
    markers,
    placedMarkersInBoundary,
    placedMarkersByFolder,
  } = useBoundaryMarkers(selectedBoundary);

  if (areaDataLoading) {
    return <LoaderPinwheel className="animate-spin" size={16} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          markers={members.markers}
          areaType="boundary"
        />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-mono uppercase text-muted-foreground">
          Markers in this boundary
        </h2>

        {placedMarkersInBoundary.length === 0 &&
          markers.every((m) => m.markers.length === 0) && (
            <p>No markers in this boundary</p>
          )}

        {placedMarkersInBoundary.length > 0 &&
          placedMarkersByFolder.map((markersGroup) => (
            <PlacedMarkersList
              key={`placed-markers-${markersGroup.folder?.id || "no-folder"}`}
              folder={markersGroup.folder}
              placedMarkers={markersGroup.placedMarkers}
            />
          ))}

        {markers?.length > 0 &&
          markers.map((markersGroup) => (
            <BoundaryMarkersGroup
              key={`markers-${markersGroup.dataSource?.id || "no-datasource"}`}
              dataSource={markersGroup.dataSource}
              markers={markersGroup.markers}
            />
          ))}
      </div>
    </div>
  );
}

// Per-source section: group-by dropdown + summary chart + marker list
function BoundaryMarkersGroup({
  dataSource,
  markers,
}: {
  dataSource: DataSource | undefined | null;
  markers: MarkerFeature[];
}) {
  const { getMarkerVisualisation, patchMarkerVisualisation } =
    useMarkerSettings();

  const dataSourceId = dataSource?.id ?? "";
  const chartColumn = getMarkerVisualisation(dataSourceId).boundaryChartColumn;
  const stringColumns = (dataSource?.columnDefs ?? []).filter(
    (c) => c.type === ColumnType.String,
  );

  return (
    <MarkersList dataSource={dataSource} markers={markers}>
      {dataSource && stringColumns.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground shrink-0">
              Group by
            </span>
            <Select
              value={chartColumn || NONE_VALUE}
              onValueChange={(v) =>
                patchMarkerVisualisation(dataSourceId, {
                  boundaryChartColumn: v === NONE_VALUE ? undefined : v,
                })
              }
            >
              <SelectTrigger
                size="sm"
                className="text-xs max-w-48 truncate cursor-pointer"
              >
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {stringColumns.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {chartColumn && (
            <MarkerCountsChart
              dataSourceId={dataSourceId}
              column={chartColumn}
              markers={markers}
            />
          )}
        </>
      )}
    </MarkersList>
  );
}
