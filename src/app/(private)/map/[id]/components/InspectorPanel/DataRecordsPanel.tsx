"use client";

import { BookOpen, SearchIcon, Settings2, Settings2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { useDataSources } from "@/hooks/useDataSources";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { useMapEditable } from "../../hooks/useMapEditable";
import { useRecordName } from "../../hooks/useRecordName";
import ConfiguredDataRecordDisplay from "./ConfiguredDataRecordDisplay";
import {
  InspectorPanelIcon,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import { useInspectorVariant } from "./InspectorVariantContext";
import RecordKeyFigures from "./RecordKeyFigures";
import type { DataRecord } from "@/models/DataRecord";

export default function DataRecordsPanel({
  dataSourceId,
  records,
  isLoading,
  defaultExpanded,
  hint,
  onClickConfigure,
}: {
  dataSourceId: string;
  records: DataRecord[];
  isLoading: boolean;
  defaultExpanded: boolean;
  hint?: string;
  onClickConfigure?: () => void;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);

  const { getName } = useRecordName(dataSourceId);
  const [search, setSearch] = useState("");

  // Records arrive in DB (primary key) order; list alphabetically by the
  // name they display. Sort a copy — the array is shared query-cache data.
  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) =>
        getName(a).localeCompare(getName(b), undefined, { numeric: true }),
      ),
    [records, getName],
  );

  // Matches the record's name or any of its values
  const query = search.trim().toLowerCase();
  const filteredRecords = useMemo(
    () =>
      query
        ? sortedRecords.filter(
            (record) =>
              getName(record).toLowerCase().includes(query) ||
              Object.values(record.json).some((value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query),
              ),
          )
        : sortedRecords,
    [getName, query, sortedRecords],
  );

  const dataSourceType = dataSource?.config?.type ?? null;
  const panelIcon = inspectorConfig?.icon ? (
    <InspectorPanelIcon
      iconName={inspectorConfig.icon}
      className="h-4 w-4 shrink-0"
    />
  ) : dataSourceType ? (
    <span className="shrink-0">
      <DataSourceIcon type={dataSourceType} />
    </span>
  ) : undefined;

  const colorClass = getInspectorColorClass(inspectorConfig?.color);
  const { variant, onConfigureSource } = useInspectorVariant();
  const editable = useMapEditable();
  // The source's settings, at the end of its toolbar (search · count · this)
  const configureButton = editable && onConfigureSource && (
    <button
      type="button"
      onClick={() => onConfigureSource(dataSourceId)}
      aria-label="Choose what this source shows"
      title="Choose what this source shows"
      className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
    >
      <Settings2Icon className="size-3.5" />
    </button>
  );

  const publishedBy = dataSource?.organisationName && (
    <div className="flex items-center gap-1 pt-2 border-t border-neutral-200/70 text-muted-foreground">
      <BookOpen className="w-3 h-3 shrink-0" />
      <p className="text-[11px] truncate">
        Published by <span className="text-neutral-400">•</span>{" "}
        {dataSource.organisationName}
      </p>
    </div>
  );

  // The light editor's tabs name the source, so the record goes straight
  // in, led by its key figures; the source's settings sit at the end of its
  // toolbar, or in the corner when there's no toolbar
  if (variant === "light") {
    return (
      <div className="flex flex-col gap-3">
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : records.length === 0 ? (
          <div className="flex items-center justify-between gap-2">
            {!hint && <p className="text-xs text-muted-foreground">No data</p>}
            {configureButton}
          </div>
        ) : records.length === 1 ? (
          <div className="relative">
            {configureButton && (
              <div className="absolute -top-1 right-0 z-10 rounded bg-white">
                {configureButton}
              </div>
            )}
            <RecordKeyFigures
              json={records[0].json}
              dataSourceId={dataSourceId}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {records.length > 5 && (
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 focus-within:border-neutral-400">
                  <SearchIcon className="size-3.5 shrink-0 text-neutral-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search records"
                    aria-label="Search records"
                    className="h-7 min-w-0 flex-1 bg-transparent text-xs outline-none"
                  />
                </label>
              )}
              <span className="ml-auto shrink-0 text-[11px] text-neutral-500 tabular-nums">
                {query
                  ? `${filteredRecords.length} of ${records.length}`
                  : `${records.length} records`}
              </span>
              {configureButton}
            </div>
            {filteredRecords.length === 0 && (
              <p className="text-xs text-muted-foreground">No records match.</p>
            )}
            <ul className="flex flex-col gap-1">
              {filteredRecords.map((record, i) => (
                <li key={record.id}>
                  <TogglePanel
                    label={getName(record)}
                    defaultExpanded={i === 0}
                  >
                    <RecordKeyFigures
                      json={record.json}
                      dataSourceId={dataSourceId}
                    />
                  </TogglePanel>
                </li>
              ))}
            </ul>
          </div>
        )}
        {publishedBy}
      </div>
    );
  }

  return (
    <TogglePanel
      label={inspectorConfig?.name || dataSource?.name || "Data"}
      icon={panelIcon}
      defaultExpanded={defaultExpanded}
      wrapperClassName={colorClass}
      headerRight={
        onClickConfigure && (
          <IconButtonWithTooltip
            tooltip="Inspector settings"
            onClick={onClickConfigure}
          >
            <Settings2 className="h-4 w-4 mr-2" />
          </IconButtonWithTooltip>
        )
      }
    >
      <div className="space-y-4 px-2">
        {hint && (
          <p className="text-sm text-muted-foreground italic text-center">
            {hint}
          </p>
        )}
        {isLoading ? (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Loading...</p>
          </div>
        ) : records.length === 0 ? (
          // The hint explains the empty state when present
          !hint && (
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No data</p>
            </div>
          )
        ) : records.length === 1 ? (
          <div>
            <ConfiguredDataRecordDisplay
              json={records[0].json}
              dataSourceId={dataSourceId}
            />
          </div>
        ) : (
          <ul>
            {sortedRecords.map((record, i) => (
              <li key={record.id}>
                <TogglePanel label={getName(record)} defaultExpanded={i === 0}>
                  <ConfiguredDataRecordDisplay
                    json={record.json}
                    dataSourceId={dataSourceId}
                  />
                </TogglePanel>
              </li>
            ))}
          </ul>
        )}

        {publishedBy}
      </div>
    </TogglePanel>
  );
}
