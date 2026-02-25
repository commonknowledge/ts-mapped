import { ArrowLeftIcon, SettingsIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useHoverArea } from "@/app/map/[id]/hooks/useMapHover";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import InspectorDataTab from "./InspectorDataTab";
import InspectorMarkersTab from "./InspectorMarkersTab";
import InspectorNotesTab from "./InspectorNotesTab";
import InspectorSettingsModal from "./InspectorSettingsModal";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const safeActiveTab = useMemo(() => {
    if (activeTab === "data" && type === LayerType.Cluster) {
      return "markers";
    }
    const isMarkers = type === LayerType.Marker || type === LayerType.Member;
    if (activeTab === "markers" && isMarkers) {
      return "data";
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
        width: "300px",
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
        <div className="flex justify-between items-center gap-2 p-3">
          <h1 className="grow flex gap-2 / text-sm font-semibold min-w-0 truncate">
            {inspectorContent?.name as string}
          </h1>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSettingsOpen(true)}
              aria-label="Inspector settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Button>
            <button
              className="cursor-pointer p-1 rounded hover:bg-neutral-100"
              aria-label="Close inspector panel"
              onClick={() => resetInspector()}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
        <InspectorSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />

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
        </UnderlineTabs>
      </div>
    </div>
  );
}
