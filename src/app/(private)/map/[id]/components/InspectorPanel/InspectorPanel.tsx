import { useQuery } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { ArrowLeftIcon, InfoIcon, PlusIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useDisplayAreaStat } from "@/app/(private)/map/[id]/hooks/useDisplayAreaStats";
import { useInspectorContent } from "@/app/(private)/map/[id]/hooks/useInspector";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { useSelectedSecondaryArea } from "@/app/(private)/map/[id]/hooks/useSelectedSecondaryArea";
import { useTurfMutations } from "@/app/(private)/map/[id]/hooks/useTurfMutations";
import { AreaSetCodeLabels } from "@/labels";
import { AreaSetCode } from "@/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
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
    resetInspector,
    selectedBoundary,
    selectedTurf,
    setFocusedRecord,
    selectedRecords,
  } = useInspectorState();
  const { inspectorContent } = useInspectorContent();
  const { type } = inspectorContent ?? {};
  const [selectedSecondaryArea] = useSelectedSecondaryArea();

  const trpc = useTRPC();
  const { insertTurf, loading: savingTurf } = useTurfMutations();
  const { areaToDisplay } = useDisplayAreaStat(selectedBoundary);

  // Fetch boundary geography when a boundary is selected
  const { data: areaData } = useQuery(
    trpc.area.byCode.queryOptions(
      {
        code: selectedBoundary?.code || "",
        areaSetCode: selectedBoundary?.areaSetCode || AreaSetCode.WMC24,
      },
      { enabled: Boolean(selectedBoundary && type === LayerType.Boundary) },
    ),
  );

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
        className={cn("absolute top-0 right-4 / flex flex-col gap-6")}
        style={{
          minWidth: "250px",
          maxWidth: "450px",
          maxHeight: "calc(100% - 80px)",
          paddingTop: "20px",
          paddingBottom: "20px",
          transition: "padding-top 0.3s",
        }}
      >
        <div
          className={cn(
            "relative z-50 w-full flex flex-col / rounded shadow-lg bg-white / text-sm font-sans",
            "min-h-0",
          )}
        >
          <div className="p-3">
            <h1 className="text-sm font-semibold">Inspector</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Click an area or marker on the map to see more details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isDetailsView = Boolean(
    (selectedTurf && type !== LayerType.Turf) ||
    (selectedBoundary && type !== LayerType.Boundary),
  );

  const markerCount = selectedRecords?.length || 0;

  const onCloseDetailsView = () => {
    setFocusedRecord(null);
  };

  const handleAddToMyAreas = () => {
    if (!areaData?.geography || !selectedBoundary) {
      toast.error("Unable to add boundary to areas");
      return;
    }

    try {
      // Convert the boundary geography to a turf polygon
      const area = turf.area(areaData.geography);
      const roundedArea = Math.round(area * 100) / 100;

      insertTurf({
        id: uuidv4(),
        label: selectedBoundary.name || "Boundary",
        notes: "",
        area: roundedArea,
        polygon: areaData.geography,
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
      className={cn("absolute top-0 right-4 / flex flex-col gap-6")}
      style={{
        minWidth: "300px",
        maxWidth: "320px",
        maxHeight: "calc(100% - 80px)",
        paddingTop: "20px",
        paddingBottom: "20px",
        transition: "padding-top 0.3s",
      }}
    >
      <div
        className={cn(
          "relative z-50 w-full flex flex-col / rounded shadow-lg bg-white / text-sm font-sans",
          "min-h-0",
        )}
      >
        <div className="flex justify-between items-center gap-4 p-3">
          <div className="flex flex-col gap-2">
            <h1 className="grow flex gap-2 items-center / text-sm font-semibold">
              {type === LayerType.Boundary &&
                areaToDisplay?.backgroundColor && (
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
                {type === LayerType.Boundary &&
                  boundaryProperties.length > 0 && (
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
            className="cursor-pointer"
            aria-label="Close inspector panel"
            onClick={() => resetInspector()}
          >
            <XIcon size={16} />
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
              <InspectorDataTab isDetailsView={isDetailsView} />
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
          <div className="border-t p-3">
            <Button
              className="w-full"
              onClick={handleAddToMyAreas}
              disabled={savingTurf || !areaData}
            >
              <PlusIcon />
              Add to areas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
