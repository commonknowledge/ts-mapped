import { ArrowLeftIcon, SettingsIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { useInspector } from "@/app/map/[id]/hooks/useInspector";
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

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = useState("data");
  const {
    inspectorContent,
    resetInspector,
    selectedBoundary,
    selectedTurf,
    focusedRecord,
    setFocusedRecord,
    selectedRecords,
  } = useInspector();

  if (!Boolean(inspectorContent)) {
    return <></>;
  }

  const { dataSource, properties, type } = inspectorContent ?? {};
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
      className={cn(
        "absolute top-0 bottom-0 right-4 / flex flex-col gap-6 py-5 h-fit max-h-full",
        "bottom-24", // to avoid clash with bug report button
      )}
      style={{ minWidth: activeTab === "config" ? "400px" : "250px" }}
    >
      <div className="relative z-100 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans">
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
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col overflow-hidden"
        >
          <UnderlineTabsList className="w-full flex gap-6 border-t px-3">
            <UnderlineTabsTrigger value="data">Data</UnderlineTabsTrigger>
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
            <UnderlineTabsTrigger value="config" className="px-2">
              <SettingsIcon size={16} />
            </UnderlineTabsTrigger>
          </UnderlineTabsList>

          <UnderlineTabsContent value="data" className="grow overflow-auto p-3">
            <InspectorDataTab
              dataSource={dataSource}
              properties={properties}
              isDetailsView={isDetailsView}
              focusedRecord={focusedRecord}
            />
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="markers"
            className="grow overflow-auto p-3"
          >
            {type && <InspectorMarkersTab type={type} />}
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="notes"
            className="grow overflow-auto p-3"
          >
            <InspectorNotesTab />
          </UnderlineTabsContent>

          <UnderlineTabsContent
            value="config"
            className="grow overflow-auto p-3"
          >
            <InspectorConfigTab />
          </UnderlineTabsContent>
        </UnderlineTabs>
      </div>
    </div>
  );
}
