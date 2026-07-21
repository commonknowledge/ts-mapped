import * as turf from "@turf/turf";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ChevronDownIcon,
  InfoIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  TableIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useBoundaryMarkers } from "@/app/(private)/map/[id]/hooks/useBoundaryMarkers";
import { useDisplayAreaStat } from "@/app/(private)/map/[id]/hooks/useDisplayAreaStats";
import { useInspectorContent } from "@/app/(private)/map/[id]/hooks/useInspector";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { useMapRef } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useSelectedAreas } from "@/app/(private)/map/[id]/hooks/useSelectedAreas";
import { useSelectedSecondaryArea } from "@/app/(private)/map/[id]/hooks/useSelectedSecondaryArea";
import { useTable } from "@/app/(private)/map/[id]/hooks/useTable";
import { useTurfMutations } from "@/app/(private)/map/[id]/hooks/useTurfMutations";
import { AreaSetCodeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { LayerType } from "@/types";
import InspectorDataTab from "./InspectorDataTab";
import InspectorMarkersTab from "./InspectorMarkersTab";
import InspectorNotesTab from "./InspectorNotesTab";
import SimplePropertiesList from "./SimplePropertiesList";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "./UnderlineTabs";

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = useState("data");

  const {
    selectedBoundary,
    selectedTurf,
    setFocusedRecord,
    selectedRecords,
    focusedRecord,
    inspectorMinimized,
    setInspectorMinimized,
  } = useInspectorState();
  const { inspectorContent } = useInspectorContent();
  const { type, dataSource } = inspectorContent ?? {};
  const [selectedSecondaryArea] = useSelectedSecondaryArea();
  const [selectedAreas, setSelectedAreas] = useSelectedAreas();

  // Selecting something new re-opens a minimised inspector
  const contentKey = `${type ?? ""}:${String(inspectorContent?.name ?? "")}`;
  useEffect(() => {
    setInspectorMinimized(false);
  }, [contentKey, setInspectorMinimized]);

  const mapRef = useMapRef();
  const { setSelectedDataSourceId } = useTable();

  const { insertTurf, loading: savingTurf } = useTurfMutations();
  const { areaToDisplay } = useDisplayAreaStat(selectedBoundary);

  // Boundary geography plus the markers inside it (shared with the Markers
  // tab, so the tab count always matches the list)
  const {
    areaGeoJson,
    geography,
    markerCount: boundaryMarkerCount,
  } = useBoundaryMarkers(type === LayerType.Boundary ? selectedBoundary : null);

  const hasData = type !== LayerType.Cluster && type !== LayerType.Turf;
  const hasMarkers = type !== LayerType.Marker && type !== LayerType.Member;

  const boundaryProperties = useMemo(() => {
    if (type !== LayerType.Boundary) return [];
    const props = [...(inspectorContent?.properties ?? [])];
    if (selectedSecondaryArea) {
      props.push({
        label:
          AreaSetCodeLabels[selectedSecondaryArea.areaSetCode] ||
          "Secondary boundary",
        value: selectedSecondaryArea.name,
      });
    }
    return props;
  }, [inspectorContent?.properties, selectedSecondaryArea, type]);

  const safeActiveTab = useMemo(() => {
    if (activeTab === "data" && !hasData) {
      return "markers";
    }
    if (activeTab === "markers" && !hasMarkers) {
      return "data";
    }
    return activeTab;
  }, [activeTab, hasData, hasMarkers]);

  if (!inspectorContent) {
    return (
      <div
        id="inspector-panel"
        className="relative z-50 flex flex-col rounded shadow-lg bg-white text-sm font-sans min-h-0 p-3 pointer-events-auto"
        style={{
          maxHeight: "calc(100% - 80px)",
        }}
      >
        <h1 className="text-sm font-semibold">Inspector</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Click an area or marker on the map to see more details.
        </p>
      </div>
    );
  }

  if (inspectorMinimized) {
    return (
      <button
        id="inspector-panel"
        type="button"
        className="relative z-50 flex items-center gap-2 rounded shadow-lg bg-white text-sm font-sans px-3 py-2 pointer-events-auto cursor-pointer self-start"
        style={{ maxWidth: "450px", minWidth: "250px" }}
        aria-label="Expand inspector panel"
        onClick={() => setInspectorMinimized(false)}
      >
        {type === LayerType.Boundary && areaToDisplay?.backgroundColor && (
          <span
            className="w-4 h-4 rounded shrink-0 border border-neutral-200"
            style={{ backgroundColor: areaToDisplay.backgroundColor }}
          />
        )}
        <span className="grow min-w-0 truncate text-left text-sm font-semibold">
          {inspectorContent?.name as string}
        </span>
        <ChevronDownIcon size={16} className="shrink-0" />
      </button>
    );
  }

  const isDetailsView = Boolean(
    (selectedTurf && type !== LayerType.Turf) ||
    (selectedBoundary && type !== LayerType.Boundary),
  );

  // Boundaries count the markers inside them; clusters count the selected
  // records the cluster click put in the inspector
  const markerCount =
    type === LayerType.Boundary
      ? boundaryMarkerCount
      : selectedRecords?.length || 0;

  const onCloseDetailsView = () => {
    setFocusedRecord(null);
  };

  const handleFlyToMarker = () => {
    const map = mapRef?.current;
    if (map && focusedRecord?.geocodePoint) {
      map.flyTo({ center: focusedRecord.geocodePoint, zoom: 12 });
    }
  };

  // Compare: toggle this boundary in the comparison list shown in the
  // hover info card (top left of the map)
  const isCompared = Boolean(
    selectedBoundary &&
    selectedAreas.some(
      (a) =>
        a.code === selectedBoundary.code &&
        a.areaSetCode === selectedBoundary.areaSetCode,
    ),
  );

  const handleToggleCompare = () => {
    if (!selectedBoundary) {
      return;
    }
    if (isCompared) {
      setSelectedAreas(
        selectedAreas.filter(
          (a) =>
            !(
              a.code === selectedBoundary.code &&
              a.areaSetCode === selectedBoundary.areaSetCode
            ),
        ),
      );
      return;
    }
    if (!geography) {
      return;
    }
    const center = turf.center(geography).geometry.coordinates;
    setSelectedAreas([
      ...selectedAreas,
      {
        code: selectedBoundary.code,
        areaSetCode: selectedBoundary.areaSetCode,
        name: selectedBoundary.name || "Boundary",
        coordinates: [center[0], center[1]],
      },
    ]);
  };

  const handleAddToMyAreas = () => {
    if (!geography || !selectedBoundary) {
      toast.error("Unable to add boundary to areas");
      return;
    }

    try {
      // Convert the boundary geography to a turf polygon
      const area = turf.area(geography);
      const roundedArea = Math.round(area * 100) / 100;

      insertTurf({
        id: uuidv4(),
        label: selectedBoundary.name || "Boundary",
        notes: "",
        area: roundedArea,
        polygon: areaGeoJson ?? "",
        position: 0,
      });

      toast.success(`Added ${selectedBoundary.name} to your areas`);
    } catch (error) {
      console.error("Error adding boundary to areas:", error);
      toast.error("Failed to add boundary to areas");
    }
  };

  return (
    <div
      id="inspector-panel"
      className="relative z-50 flex flex-col rounded shadow-lg bg-white text-sm font-sans min-h-0 max-h-full pointer-events-auto"
      style={{ maxWidth: "450px", minWidth: "250px" }}
    >
      <div className="flex justify-between items-center gap-4 p-3">
        <div className="flex flex-col gap-2">
          <h1 className="grow flex gap-2 items-center / text-sm font-semibold">
            {type === LayerType.Boundary && areaToDisplay?.backgroundColor && (
              <span
                className="w-4 h-4 rounded shrink-0 border border-neutral-200"
                style={{ backgroundColor: areaToDisplay.backgroundColor }}
              />
            )}
            {inspectorContent?.name as string}
          </h1>
          {areaToDisplay && (
            <h2 className="text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
              <span>{AreaSetCodeLabels[areaToDisplay.areaSetCode]}</span>
              {type === LayerType.Boundary && boundaryProperties.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      aria-label="Boundary info"
                    >
                      <InfoIcon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="bg-white text-foreground border border-neutral-200 shadow-md px-3 py-2 max-w-xs"
                  >
                    <SimplePropertiesList properties={boundaryProperties} />
                  </TooltipContent>
                </Tooltip>
              )}
            </h2>
          )}
        </div>
        <button
          className="cursor-pointer self-start"
          aria-label="Minimise inspector panel"
          onClick={() => setInspectorMinimized(true)}
        >
          <MinusIcon size={16} />
        </button>
      </div>

      {isDetailsView && (
        <div className="px-4 pb-2">
          <button
            onClick={() => onCloseDetailsView()}
            className="flex gap-1 text-xs text-left opacity-70 hover:opacity-100 cursor-pointer"
          >
            <ArrowLeftIcon size={12} className="mt-[2px]" />
            <span>
              Back to{" "}
              <span className="inline-flex items-center gap-1 font-semibold">
                {selectedTurf
                  ? selectedTurf.name || "Area"
                  : selectedBoundary
                    ? selectedBoundary.name || "Boundary"
                    : ""}
              </span>
            </span>
          </button>
        </div>
      )}

      <UnderlineTabs
        defaultValue="data"
        value={safeActiveTab}
        onValueChange={setActiveTab}
        className="flex flex-col min-h-0"
      >
        <UnderlineTabsList
          value={safeActiveTab}
          className="w-full flex gap-6 border-t px-3"
        >
          {hasData && (
            <UnderlineTabsTrigger value="data">Data</UnderlineTabsTrigger>
          )}
          {hasMarkers && (
            <UnderlineTabsTrigger value="markers">
              Markers {markerCount > 0 ? markerCount : ""}
            </UnderlineTabsTrigger>
          )}
          <UnderlineTabsTrigger value="notes" className="hidden">
            Notes 0
          </UnderlineTabsTrigger>
        </UnderlineTabsList>

        {hasData && (
          <UnderlineTabsContent value="data" className="overflow-auto p-3">
            <InspectorDataTab />
          </UnderlineTabsContent>
        )}

        {hasMarkers && (
          <UnderlineTabsContent value="markers" className="overflow-auto p-3">
            {type && <InspectorMarkersTab type={type} />}
          </UnderlineTabsContent>
        )}

        <UnderlineTabsContent value="notes" className="overflow-auto p-3">
          <InspectorNotesTab />
        </UnderlineTabsContent>
      </UnderlineTabs>
      {type === LayerType.Boundary && (
        <div className="border-t p-3 flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={handleAddToMyAreas}
            disabled={savingTurf || !areaGeoJson}
          >
            <PlusIcon />
            Add to areas
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleToggleCompare}
            disabled={!isCompared && !geography}
          >
            <ChartBarIcon />
            {isCompared ? "Remove from comparison" : "Compare"}
          </Button>
        </div>
      )}
      {hasData &&
        type !== LayerType.Boundary &&
        ((isDetailsView && focusedRecord?.geocodePoint) || dataSource) && (
          <div className="border-t p-3 flex flex-col gap-2">
            {isDetailsView && focusedRecord?.geocodePoint && (
              <Button onClick={handleFlyToMarker}>
                <MapPinIcon />
                View on map
              </Button>
            )}
            {dataSource && (
              <Button
                variant="secondary"
                onClick={() => setSelectedDataSourceId(dataSource.id)}
              >
                <TableIcon />
                View in table
              </Button>
            )}
          </div>
        )}
    </div>
  );
}
