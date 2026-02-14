import { useQuery } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { ArrowLeftIcon, SettingsIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useHoverArea } from "@/app/map/[id]/hooks/useMapHover";
import { useTurfMutations } from "@/app/map/[id]/hooks/useTurfMutations";
import { AreaSetCode } from "@/server/models/AreaSet";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import InspectorConfigTab from "./InspectorConfigTab";
import InspectorDataTab from "./InspectorDataTab";
import InspectorMarkersTab from "./InspectorMarkersTab";
import InspectorNotesTab from "./InspectorNotesTab";
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "./UnderlineTabs";

export default function InspectorPanel({
  boundariesPanelOpen = false,
}: {
  boundariesPanelOpen?: boolean;
} = {}) {
  const [activeTab, setActiveTab] = useState("data");
  const [hoverArea] = useHoverArea();
  const boundaryHoverVisible = boundariesPanelOpen && !!hoverArea;

  const {
    inspectorContent,
    resetInspector,
    selectedBoundary,
    selectedTurf,
    focusedRecord,
    setFocusedRecord,
    selectedRecords,
  } = useInspector();
  const { dataSource, properties, type } = inspectorContent ?? {};

  const trpc = useTRPC();
  const { insertTurf, loading: savingTurf } = useTurfMutations();

  // Fetch boundary geography when a boundary is selected
  const { data: areaData } = useQuery(
    trpc.area.byCode.queryOptions(
      {
        code: selectedBoundary?.areaCode || "",
        areaSetCode: selectedBoundary?.areaSetCode || AreaSetCode.WMC24,
      },
      { enabled: Boolean(selectedBoundary && type === LayerType.Boundary) },
    ),
  );

  const hasData = type !== LayerType.Cluster && type !== LayerType.Turf;
  const hasMarkers = type !== LayerType.Marker && type !== LayerType.Member;
  const hasConfig = type === LayerType.Boundary;

  const safeActiveTab = useMemo(() => {
    if (activeTab === "data" && !hasData) {
      return "markers";
    }
    if (activeTab === "markers" && !hasMarkers) {
      return "data";
    }
    if (activeTab === "config" && !hasConfig) {
      return hasMarkers ? "markers" : "data";
    }
    return activeTab;
  }, [activeTab, hasConfig, hasData, hasMarkers]);

  if (!Boolean(inspectorContent)) {
    return <></>;
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
      className={cn("absolute top-0 bottom-0 right-4 / flex flex-col gap-6")}
      style={{
        minWidth: safeActiveTab === "config" ? "400px" : "250px",
        maxWidth: "450px",
        maxHeight: "calc(100% - 80px)",
        paddingTop: boundaryHoverVisible ? "80px" : "20px",
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
          <h1 className="grow flex gap-2 / text-sm font-semibold">
            {inspectorContent?.name as string}
          </h1>
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
          <UnderlineTabsList className="w-full flex gap-6 border-t px-3">
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
            {hasConfig && (
              <UnderlineTabsTrigger value="config" className="px-2">
                <SettingsIcon size={16} />
              </UnderlineTabsTrigger>
            )}
          </UnderlineTabsList>

          {hasData && (
            <UnderlineTabsContent value="data" className="overflow-auto p-3">
              <InspectorDataTab
                dataSource={dataSource}
                properties={properties}
                isDetailsView={isDetailsView}
                focusedRecord={focusedRecord}
                type={type}
              />
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

          {hasConfig && (
            <UnderlineTabsContent value="config" className="overflow-auto p-3">
              <InspectorConfigTab />
            </UnderlineTabsContent>
          )}
        </UnderlineTabs>
        {type === LayerType.Boundary && (
          <div className="border-t p-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddToMyAreas}
              disabled={savingTurf || !areaData}
            >
              Add to my areas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
