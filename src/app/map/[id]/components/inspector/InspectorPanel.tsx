import { useAtom } from "jotai";
import { ArrowLeftIcon, ChartBar, FileText, InfoIcon, SettingsIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { compareGeographiesAtom } from "@/app/map/[id]/atoms/mapStateAtoms";
import { selectedAreasAtom } from "@/app/map/[id]/atoms/selectedAreasAtom";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import AreaInfo from "../AreaInfo";
import CollapsedPanelButton from "../CollapsedPanelButton";
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
  const [selectedAreas] = useAtom(selectedAreasAtom);
  const [compareGeographiesMode, setCompareGeographiesMode] = useAtom(
    compareGeographiesAtom,
  );
  const [showComparisonAreas, setShowComparisonAreas] = useState(false);
  const [isExplicitlyCollapsed, setIsExplicitlyCollapsed] = useState(false);
  const [isInspectorPanelCollapsed, setIsInspectorPanelCollapsed] = useState(true);
  const [userExplicitlyCollapsed, setUserExplicitlyCollapsed] = useState(false);
  const {
    inspectorContent,
    selectedBoundary,
    selectedTurf,
    focusedRecord,
    setFocusedRecord,
    selectedRecords,
  } = useInspector();

  const hasSelectedAreas = selectedAreas.length > 0;

  // Create a unique key from inspector content to detect changes
  const inspectorContentKey = useMemo(() => {
    if (!inspectorContent) return null;
    return `${inspectorContent.type}-${inspectorContent.name}-${selectedBoundary?.areaCode || selectedTurf?.id || focusedRecord?.id || ''}`;
  }, [inspectorContent, selectedBoundary?.areaCode, selectedTurf?.id, focusedRecord?.id]);

  const [previousContentKey, setPreviousContentKey] = useState<string | null>(null);

  // Auto-show comparison section when areas are selected (unless explicitly collapsed)
  useEffect(() => {
    if (hasSelectedAreas && !showComparisonAreas && !isExplicitlyCollapsed) {
      setShowComparisonAreas(true);
    }
  }, [hasSelectedAreas, showComparisonAreas, isExplicitlyCollapsed]);

  // Open inspector and show comparison section when compare mode is enabled
  useEffect(() => {
    if (compareGeographiesMode) {
      // Open inspector if collapsed
      if (isInspectorPanelCollapsed) {
        setIsInspectorPanelCollapsed(false);
        setUserExplicitlyCollapsed(false);
      }
      // Show comparison section
      if (!showComparisonAreas) {
        setShowComparisonAreas(true);
        setIsExplicitlyCollapsed(false);
      }
    }
  }, [compareGeographiesMode, isInspectorPanelCollapsed, showComparisonAreas]);

  // Auto-expand panel when NEW inspector content appears (not when user has explicitly collapsed)
  useEffect(() => {
    const isNewContent = inspectorContentKey !== null && inspectorContentKey !== previousContentKey;
    
    if (isNewContent && isInspectorPanelCollapsed && !userExplicitlyCollapsed) {
      setIsInspectorPanelCollapsed(false);
      setUserExplicitlyCollapsed(false); // Reset flag when new content appears
    }
    
    if (inspectorContentKey !== previousContentKey) {
      setPreviousContentKey(inspectorContentKey);
    }
  }, [inspectorContentKey, isInspectorPanelCollapsed, userExplicitlyCollapsed, previousContentKey]);

  const handleToggleComparisonSection = () => {
    const newShowState = !showComparisonAreas;
    setShowComparisonAreas(newShowState);
    setIsExplicitlyCollapsed(!newShowState); // Track explicit collapse/expand
    
    if (newShowState) {
      // Show section: enable comparison mode so users can click areas to add them
      setCompareGeographiesMode(true);
    } else {
      // When collapsing, disable compare mode (stop adding to list) but preserve the list
      setCompareGeographiesMode(false);
    }
  };
  

  const { dataSource, properties, type } = inspectorContent ?? {};
  const isDetailsView = Boolean(
    (selectedTurf && type !== LayerType.Turf) ||
      (selectedBoundary && type !== LayerType.Boundary),
  );

  const markerCount = selectedRecords?.length || 0;

  const onCloseDetailsView = () => {
    setFocusedRecord(null);
  };

  // Calculate width based on comparison section visibility and active tab
  const getInspectorWidth = () => {
    if (showComparisonAreas) {
      return "400px"; // Wider when comparison section is visible
    }
    if (activeTab === "config") {
      return "400px";
    }
    return "250px";
  };

  return (
    <>
      {/* Collapsed icon button - always visible */}
      {isInspectorPanelCollapsed && (
        <CollapsedPanelButton
          icon={InfoIcon}
          onClick={() => {
            setIsInspectorPanelCollapsed(false);
            setUserExplicitlyCollapsed(false); // Reset flag when user manually expands
          }}
          ariaLabel="Open inspector panel"
          title="Open inspector"
          badge={hasSelectedAreas ? selectedAreas.length : undefined}
          className="right-3"
        />
      )}

      {/* Inspector Panel */}
      <div
        id="inspector-panel"
        className={cn(
          "absolute top-0 bottom-0 right-4 / flex flex-col gap-6 py-5 transition-all duration-300 ease-in-out",
          "bottom-24", // to avoid clash with bug report button
          isInspectorPanelCollapsed
            ? "translate-x-full opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100",
          activeTab === "config" ? "h-full" : "h-fit max-h-full",
        )}
        style={{
          width: getInspectorWidth(),
          minWidth: getInspectorWidth(),
          maxWidth: getInspectorWidth(),
          transition: "width 0.3s ease-in-out, min-width 0.3s ease-in-out, max-width 0.3s ease-in-out, transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
        }}
      >
        <div
          className={cn(
            "relative z-50 w-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans",
            activeTab === "config" ? "h-full" : "max-h-full",
          )}
        >
          {/* Inspector Header */}
          <div className="flex justify-between items-center gap-4 p-3 border-b">
            <h1 className="grow flex gap-2 / text-sm font-semibold">
              Inspector
            </h1>
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors relative",
                  showComparisonAreas
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-neutral-100",
                )}
                aria-label={
                  showComparisonAreas
                    ? "Hide comparison areas"
                    : "Show comparison areas"
                }
                onClick={handleToggleComparisonSection}
                title={
                  showComparisonAreas
                    ? "Hide comparison areas (click areas on map to add them)"
                    : "Show comparison areas (click areas on map to add them)"
                }
              >
                <ChartBar size={14} />
                <span>Compare</span>
                {!showComparisonAreas && hasSelectedAreas && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#30a46c] text-[10px] font-semibold text-primary-foreground">
                    {selectedAreas.length}
                  </span>
                )}
              </button>
              <button
                className="cursor-pointer hover:bg-neutral-100 rounded p-1 transition-colors"
                aria-label="Collapse inspector panel"
                onClick={() => {
                  setIsInspectorPanelCollapsed(true);
                  setUserExplicitlyCollapsed(true); // Mark that user explicitly collapsed it
                  setCompareGeographiesMode(false); // Disable add to list mode when collapsing
                }}
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>

        {/* Comparison Areas (AreaInfo) */}
        {showComparisonAreas && (
          <div className="border-b px-2 bg-neutral-50">            
            <AreaInfo 
              onStopAdding={() => setCompareGeographiesMode(!compareGeographiesMode)}
              compareModeEnabled={compareGeographiesMode}
              isSectionVisible={showComparisonAreas}
            />
          </div>
        )}

        {/* Selected Area (Current Inspector Content) */}
        {Boolean(inspectorContent) ? (
          <>
            {isDetailsView && (
              <div className="px-4 pb-2 border-b">
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

            <div className="px-3 py-2">
              <h2 className="text-lg font-semibold ">
                {inspectorContent?.name || ""}
              </h2>
            </div>

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
                  type={type}
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
                className="grow overflow-auto p-3 h-full"
              >
                <InspectorConfigTab />
              </UnderlineTabsContent>
            </UnderlineTabs>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <FileText size={48} className="text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Select an area to see its data in the Inspector
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
