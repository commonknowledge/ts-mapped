import { LoaderPinwheel, MapPinOffIcon } from "lucide-react";

import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { useBoundaryMarkers } from "../../hooks/useBoundaryMarkers";
import { useMapConfig } from "../../hooks/useMapConfig";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import RingSwatch from "../RingSwatch";
import { useInspectorVariant } from "./InspectorVariantContext";
import MarkerCountsChart from "./MarkerCountsChart";
import { MarkersList, MembersList, PlacedMarkersList } from "./MarkersLists";
import type { DataSource } from "@/models/DataSource";
import type { MarkerFeature } from "@/types";

const NONE_VALUE = "__none__";

export default function BoundaryMarkersList() {
  const { selectedBoundary } = useInspectorState();
  const boundaryMarkers = useBoundaryMarkers(selectedBoundary);
  const { areaDataRefreshing } = boundaryMarkers;
  return (
    <div
      aria-busy={areaDataRefreshing}
      className={cn(
        "transition-opacity duration-200",
        areaDataRefreshing && "opacity-40",
      )}
    >
      <BoundaryMarkersListContent boundaryMarkers={boundaryMarkers} />
    </div>
  );
}

function BoundaryMarkersListContent({
  boundaryMarkers,
}: {
  boundaryMarkers: ReturnType<typeof useBoundaryMarkers>;
}) {
  const {
    areaDataLoading,
    members,
    markers,
    placedMarkersInBoundary,
    placedMarkersByFolder,
  } = boundaryMarkers;

  const isLight = useInspectorVariant().variant === "light";

  if (areaDataLoading) {
    return <LoaderPinwheel className="animate-spin" size={16} />;
  }

  // The light editor has no members/markers split: every layer is a
  // marker layer, each listed under its own name and ring
  if (isLight) {
    const groups = [...(members ? [members] : []), ...markers].filter(
      (group) => group.markers.length > 0,
    );
    if (groups.length === 0 && placedMarkersInBoundary.length === 0) {
      return <NoMarkersInArea />;
    }
    return (
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <BoundaryMarkersGroup
            key={`markers-${group.dataSource?.id || "no-datasource"}`}
            dataSource={group.dataSource}
            markers={group.markers}
          />
        ))}
        {placedMarkersByFolder.map((markersGroup) => (
          <PlacedMarkersList
            key={`placed-markers-${markersGroup.folder?.id || "no-folder"}`}
            folder={markersGroup.folder}
            placedMarkers={markersGroup.placedMarkers}
          />
        ))}
      </div>
    );
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

// An area with none of the map's markers in it: says so plainly, with each
// layer at 0, so it reads as an answer rather than something missing
function NoMarkersInArea() {
  const { selectedBoundary } = useInspectorState();
  const { mapConfig } = useMapConfig();
  const layerIds = [
    ...(mapConfig.membersDataSourceId ? [mapConfig.membersDataSourceId] : []),
    ...mapConfig.markerDataSourceIds,
  ];
  const areaName = selectedBoundary?.name || "this area";

  if (!layerIds.length) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-4 text-center">
        <MapPinOffIcon className="size-5 text-neutral-300" />
        <p className="text-xs text-neutral-500">
          No markers on this map yet. Add members or places from + next to
          Markers to see who&apos;s in each area.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-1.5 py-2 text-center">
        <MapPinOffIcon className="size-5 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-800">
          No markers in {areaName}
        </p>
        <p className="text-xs text-neutral-500">
          Areas with markers show clusters of rings on the map.
        </p>
      </div>
      <ul className="flex flex-col gap-1 border-t border-neutral-100 pt-3">
        {layerIds.map((id) => (
          <EmptyLayerRow key={id} dataSourceId={id} />
        ))}
      </ul>
    </div>
  );
}

function EmptyLayerRow({ dataSourceId }: { dataSourceId: string }) {
  const { getDataSourceById } = useDataSources();
  const color = useMarkerLayerColor(dataSourceId);
  return (
    <li className="flex items-center gap-2 text-xs text-neutral-500">
      {color && <RingSwatch color={color} size={12} />}
      <span className="min-w-0 flex-1 truncate">
        {getDataSourceById(dataSourceId)?.name ?? "Marker layer"}
      </span>
      <span className="tabular-nums">0</span>
    </li>
  );
}
