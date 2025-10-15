import * as turfLib from "@turf/turf";
import { ListIcon, Locate, TableIcon, XIcon } from "lucide-react";
import React, { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import DataSourceIcon from "@/components/DataSourceIcon";
import LayerIcon from "@/components/LayerIcon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import AreasContainingRecord from "./AreasContainingRecord";
import BoundaryList from "./BoundaryList";
import BoundaryMarkersList from "./BoundaryMarkersList";
import { InspectorContentFactory } from "./inspectorContentFactory";
import PropertiesList from "./PropertiesList";
import TurfMarkersList from "./TurfMarkersList";

export default function InspectorPanel() {
  const { inspectorContent, resetInspector, setInspectorContent } =
    useContext(InspectorContext);
  const { mapRef } = useContext(MapContext);
  const { setSelectedDataSourceId, selectedDataSourceId } =
    useContext(TableContext);
  const { placedMarkers, turfs } = useContext(MarkerAndTurfContext);
  const { viewConfig } = useMapViews();

  if (!inspectorContent) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent;
  const tableOpen = Boolean(selectedDataSourceId);

  const flyToMarker = () => {
    const map = mapRef?.current;
    if (!map || !inspectorContent.id) return;

    if (inspectorContent.type === LayerType.Marker) {
      // For placed markers, find the marker by ID and fly to its coordinates
      const placedMarker = placedMarkers.find(
        (marker) => marker.id === inspectorContent.id,
      );
      if (placedMarker) {
        map.flyTo({
          center: [placedMarker.point.lng, placedMarker.point.lat],
          zoom: 12,
        });
      }
    } else if (inspectorContent.type === LayerType.Member) {
      // For data source records, use geocodePoint from properties
      const geocodePoint = inspectorContent.properties?.geocodePoint as
        | { lng: number; lat: number }
        | undefined;
      if (geocodePoint && geocodePoint.lng && geocodePoint.lat) {
        map.flyTo({
          center: [geocodePoint.lng, geocodePoint.lat],
          zoom: 12,
        });
      }
    }
  };

  const flyToArea = () => {
    const map = mapRef?.current;
    if (!map || !inspectorContent.boundaryFeature) {
      return;
    }

    // For boundaries, use fitBounds to show the entire area
    if (inspectorContent.boundaryFeature.bbox) {
      map.fitBounds(
        inspectorContent.boundaryFeature.bbox as [
          number,
          number,
          number,
          number,
        ],
        {
          padding: 50,
          duration: 1000,
        },
      );
    } else {
      // Try to calculate bounds from geometry if bbox is not available
      if (inspectorContent.boundaryFeature.geometry) {
        try {
          const bounds = turfLib.bbox(
            inspectorContent.boundaryFeature as unknown as turfLib.AllGeoJSON,
          );
          map.fitBounds(bounds as [number, number, number, number], {
            padding: 50,
            duration: 1000,
          });
        } catch (error) {
          console.error("Failed to calculate bounds:", error);
        }
      }
    }
  };

  const flyToTurf = () => {
    const map = mapRef?.current;
    if (!map || !inspectorContent.properties?.id) {
      return;
    }

    const turfId = inspectorContent.properties.id;
    const turfData = turfs.find((t) => t.id === turfId);

    if (turfData && turfData.polygon) {
      try {
        const bounds = turfLib.bbox(turfData.polygon);
        map.fitBounds(bounds as [number, number, number, number], {
          padding: 50,
          duration: 1000,
        });
      } catch (error) {
        console.error("Failed to calculate turf bounds:", error);
      }
    }
  };

  // Show boundary list if this is a boundary list view AND a shape is selected
  if (
    type === LayerType.Boundary &&
    inspectorContent.name === "Boundaries" &&
    viewConfig.areaSetGroupCode
  ) {
    return <BoundaryList />;
  }

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-4 flex flex-col gap-6 w-60 pt-20 pb-5",
        tableOpen ? "bottom-0" : "bottom-24",
      )}
    >
      <div className="relative z-10 w-full max-h-full overflow-auto flex flex-col rounded shadow-lg bg-white text-sm font-sans group">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 p-3">
          <h1 className="grow flex items-center gap-2 text-sm font-semibold">
            <LayerIcon type={type} dataSource={dataSource} />
            {inspectorContent.name}
          </h1>
          <div className="flex items-center gap-2">
            {/* Show "All" button for individual boundaries */}
            {type === LayerType.Boundary &&
              inspectorContent.name !== "Boundaries" && (
                <button
                  onClick={() => {
                    // Navigate to boundary list
                    const boundaryListContent =
                      InspectorContentFactory.createBoundariesListInspectorContent();
                    setInspectorContent(boundaryListContent);
                  }}
                  className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 cursor-pointer"
                  title="View all boundaries"
                >
                  <ListIcon size={12} />
                  All
                </button>
              )}
            <button
              className="cursor-pointer"
              aria-label="Close inspector panel"
              onClick={() => resetInspector()}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-4 p-4">
            {dataSource ? (
              <div className="bg-muted py-1 px-2 rounded">
                <h3 className="mb-1 text-muted-foreground text-xs uppercase font-mono">
                  Data source
                </h3>
                <div className="flex items-center gap-2">
                  <div className="shrink-0">
                    <DataSourceIcon type={dataSource.config?.type as string} />
                  </div>
                  <p className="truncate">{dataSource.name}</p>
                </div>
              </div>
            ) : null}

            <PropertiesList properties={properties} />

            {type === LayerType.Turf ? <TurfMarkersList /> : null}

            {type === LayerType.Boundary &&
            inspectorContent.name !== "Boundaries" ? (
              <BoundaryMarkersList />
            ) : null}

            {(type === LayerType.Member || type === LayerType.Marker) &&
            inspectorContent.id ? (
              <AreasContainingRecord
                recordId={inspectorContent.id}
                recordType={type}
              />
            ) : null}
          </div>
        </div>

        {/* Actions section - always at bottom */}
        {dataSource ||
        inspectorContent.id ||
        inspectorContent.boundaryFeature ||
        (type === LayerType.Turf && inspectorContent.properties?.id) ? (
          <div className="flex flex-col gap-3 border-t p-4 bg-white">
            {/* Show on map button for members and markers */}
            {(type === LayerType.Member || type === LayerType.Marker) &&
            inspectorContent.id ? (
              <Button onClick={() => flyToMarker()}>
                <Locate />
                Show on map
              </Button>
            ) : null}

            {type === LayerType.Boundary && inspectorContent.boundaryFeature ? (
              <Button onClick={() => flyToArea()}>
                <Locate />
                Show on map
              </Button>
            ) : null}

            {type === LayerType.Turf && inspectorContent.properties?.id ? (
              <Button onClick={() => flyToTurf()}>
                <Locate />
                Show on map
              </Button>
            ) : null}

            {/* View in table button for data source records */}
            {dataSource ? (
              <Button
                variant="secondary"
                onClick={() => setSelectedDataSourceId(dataSource.id)}
              >
                <TableIcon />
                Show in table
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
