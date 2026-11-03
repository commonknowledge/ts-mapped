"use client";

import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { Separator } from "@/shadcn/ui/separator";
import { InspectorConfigEditor } from "../../components/InspectorPanel/InspectorConfigModal";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useShowControls } from "../../hooks/useMapControls";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { useOpenInspectorConfig } from "../../hooks/useOpenInspectorConfig";
import { CONTROL_PANEL_WIDTH } from "../../styles";
import { useAddMarkersPanel } from "../hooks/useAddMarkersPanel";
import { useInspectorEditingDataSourceId } from "../hooks/useInspectorCustomise";

// Wider than the other flyouts: the column editor has a lot to show
const PANEL_WIDTH = 440;

// One inspector section's title, icon and columns, in a flyout beside the
// Layers panel instead of a modal, so the inspector stays visible
export default function LightInspectorEditPanel() {
  const [dataSourceId, setDataSourceId] = useInspectorEditingDataSourceId();
  const showControls = useShowControls();
  const { getDataSourceById } = useDataSources();
  const { boundariesPanelOpen } = useChoropleth();
  const { markerSettingsDataSourceId } = useMarkerSettings();
  const [isMarkersPanelOpen] = useAddMarkersPanel();
  const { config, openConfig, onUpdateConfig } =
    useOpenInspectorConfig(dataSourceId);

  // Gives up the flyout slot when another flyout opens
  useEffect(() => {
    if (
      boundariesPanelOpen ||
      markerSettingsDataSourceId ||
      isMarkersPanelOpen
    ) {
      setDataSourceId(null);
    }
  }, [
    boundariesPanelOpen,
    isMarkersPanelOpen,
    markerSettingsDataSourceId,
    setDataSourceId,
  ]);

  // Seeds a config from the data source's defaults if there isn't one yet
  useEffect(() => {
    if (dataSourceId && !config) {
      openConfig();
    }
  }, [config, dataSourceId, openConfig]);

  if (!dataSourceId) return null;
  const dataSource = getDataSourceById(dataSourceId);

  return (
    <div
      className="absolute top-0 z-100 flex h-full flex-col gap-3 overflow-y-auto border-r border-neutral-200 bg-neutral-50 p-3"
      style={{
        left: showControls ? CONTROL_PANEL_WIDTH : 0,
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
      }}
      aria-label="Edit inspector section"
    >
      <div className="flex items-start justify-between gap-6 text-sm">
        <div className="mt-2 min-w-0">
          <p className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
            Inspector section
          </p>
          <h3 className="truncate font-medium">
            {dataSource?.name ?? "Data source"}
          </h3>
        </div>
        <button
          type="button"
          aria-label="Close inspector section editor"
          className="cursor-pointer text-muted-foreground hover:text-primary"
          onClick={() => setDataSourceId(null)}
        >
          <XIcon size={20} />
        </button>
      </div>
      <Separator />
      {config ? (
        <InspectorConfigEditor
          config={config}
          onUpdate={onUpdateConfig}
          compact
        />
      ) : (
        <p className="text-xs text-neutral-500">Loading…</p>
      )}
    </div>
  );
}
