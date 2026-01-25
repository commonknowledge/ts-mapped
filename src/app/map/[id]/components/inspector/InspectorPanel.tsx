import { ArrowLeftIcon, SettingsIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useHoverArea } from "@/app/map/[id]/hooks/useMapHover";
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

  console.log(
    "[InspectorPanel] boundariesPanelOpen:",
    boundariesPanelOpen,
    "hoverArea:",
    hoverArea,
    "boundaryHoverVisible:",
    boundaryHoverVisible,
  );

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

  const safeActiveTab = useMemo(() => {
    if (activeTab === "data" && type === LayerType.Cluster) {
      return "markers";
    }
    const isMarkers = type === LayerType.Marker || type === LayerType.Member;
    if (activeTab === "markers" && isMarkers) {
      return "data";
    }
    if (activeTab === "config" && type !== LayerType.Boundary) {
      return type === LayerType.Cluster ? "markers" : "data";
    }
    return activeTab;
  }, [activeTab, type]);

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
            {type !== LayerType.Cluster && (
              <UnderlineTabsTrigger value="data">Data</UnderlineTabsTrigger>
            )}
            <UnderlineTabsTrigger
              value="markers"
              className={cn(
                (type === LayerType.Member || type === LayerType.Marker) &&
                  "hidden",
              )}
            >
              Markers {markerCount > 0 ? markerCount : ""}
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="notes" className="hidden">
              Notes 0
            </UnderlineTabsTrigger>
            {type === LayerType.Boundary && (
              <UnderlineTabsTrigger value="config" className="px-2">
                <SettingsIcon size={16} />
              </UnderlineTabsTrigger>
            )}
          </UnderlineTabsList>

          {type !== LayerType.Cluster && (
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

          <UnderlineTabsContent value="markers" className="overflow-auto p-3">
            {type && <InspectorMarkersTab type={type} />}
          </UnderlineTabsContent>

          <UnderlineTabsContent value="notes" className="overflow-auto p-3">
            <InspectorNotesTab />
          </UnderlineTabsContent>

          {type === LayerType.Boundary && (
            <UnderlineTabsContent value="config" className="overflow-auto p-3">
              <InspectorConfigTab />
            </UnderlineTabsContent>
          )}
        </UnderlineTabs>
      </div>
    </div>
  );
}
