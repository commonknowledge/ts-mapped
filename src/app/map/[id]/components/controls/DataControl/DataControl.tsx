"use client";

import { ChevronDown, Database, Plus } from "lucide-react";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import {
  inspectorSettingsModalOpenAtom,
  inspectorSettingsInitialDataSourceIdAtom,
} from "@/app/map/[id]/atoms/inspectorAtoms";
import { dataSourceRecordTypeLabels } from "@/components/DataSourceRecordTypeIcon";
import { DataSourceTypeLabels } from "@/labels";
import DataSourceRecordTypeIcon from "@/components/DataSourceRecordTypeIcon";
import LayerControlWrapper from "../LayerControlWrapper";
import type {
  DataSourceRecordType,
  DataSourceType,
} from "@/server/models/DataSource";

function useMapDataSources() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { getDataSourceById } = useDataSources();

  const ids = new Set<string>();
  if (viewConfig.areaDataSourceId) ids.add(viewConfig.areaDataSourceId);
  mapConfig.markerDataSourceIds.forEach((id) => ids.add(id));
  if (mapConfig.membersDataSourceId) ids.add(mapConfig.membersDataSourceId);

  return Array.from(ids)
    .map((id) => getDataSourceById(id))
    .filter((ds): ds is NonNullable<typeof ds> => ds != null);
}

function DataSourceRow({
  dataSource,
  onClick,
}: {
  dataSource: {
    id: string;
    name: string;
    config: { type: DataSourceType };
    recordCount?: number;
    recordType?: DataSourceRecordType;
  };
  onClick: () => void;
}) {
  const subtitle = [
    DataSourceTypeLabels[dataSource.config.type],
    dataSource.recordCount != null ? String(dataSource.recordCount) : null,
    dataSource.recordType && dataSourceRecordTypeLabels[dataSource.recordType]
      ? dataSourceRecordTypeLabels[dataSource.recordType]
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
    >
      {dataSource.recordType != null ? (
        <DataSourceRecordTypeIcon
          type={dataSource.recordType}
          withBackground={false}
          className="w-4 h-4 shrink-0 text-muted-foreground"
        />
      ) : (
        <Database className="w-4 h-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{dataSource.name}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground -rotate-90" />
    </button>
  );
}

export default function DataControl() {
  const [expanded, setExpanded] = useState(true);
  const setModalOpen = useSetAtom(inspectorSettingsModalOpenAtom);
  const setInitialDataSourceId = useSetAtom(
    inspectorSettingsInitialDataSourceIdAtom,
  );
  const mapDataSources = useMapDataSources();

  const openInspectorSettings = (dataSourceId: string | null) => {
    setInitialDataSourceId(dataSourceId);
    setModalOpen(true);
  };

  return (
    <LayerControlWrapper>
      <div className="flex items-center justify-between relative px-4 py-3">
        <div className="group flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 hover:bg-neutral-100 rounded px-1 py-2 -mx-1 text-sm font-medium cursor-pointer"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
            />
            <Database size={16} className="shrink-0 text-muted-foreground" />
            Visualisation Data
          </button>
        </div>
        <button
          type="button"
          onClick={() => openInspectorSettings(null)}
          className="p-2 rounded hover:bg-neutral-100 shrink-0"
          aria-label="Visualisation data settings"
        >
          <Plus size={16} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {mapDataSources.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1 py-2">
              No data sources on this map. Add markers or a data visualisation.
            </p>
          ) : (
            mapDataSources.map((ds) => (
              <DataSourceRow
                key={ds.id}
                dataSource={ds}
                onClick={() => openInspectorSettings(ds.id)}
              />
            ))
          )}
        </div>
      )}
    </LayerControlWrapper>
  );
}
