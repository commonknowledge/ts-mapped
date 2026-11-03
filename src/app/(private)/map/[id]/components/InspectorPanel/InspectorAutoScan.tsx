"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SparklesIcon, Undo2Icon } from "lucide-react";
import { useState } from "react";
import { DUMMY_COUNT_COLUMN } from "@/constants";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnDisplayFormat } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import { scanInspectorColumns } from "../../utils/inspectorAutoScan";
import type { InspectorConfig } from "../../hooks/useUpdateInspectorConfig";
import type { AutoScanResult } from "../../utils/inspectorAutoScan";
import type { ColumnSemanticType } from "@/models/DataSource";

// Records read to judge each column; the most the sample endpoint allows
const SAMPLE_SIZE = 50;

const REASON_LABELS: Record<string, [string, string]> = {
  identifier: ["ID or code", "IDs and codes"],
  location: ["location field", "location fields"],
  unnamed: ["unnamed column", "unnamed columns"],
  empty: ["empty column", "empty columns"],
};

const summarise = (result: AutoScanResult) => {
  const counts = new Map<string, number>();
  result.hidden.forEach(({ reason }) =>
    counts.set(reason, (counts.get(reason) ?? 0) + 1),
  );
  const hidden = [...counts]
    .map(([reason, n]) => {
      const [one, many] = REASON_LABELS[reason] ?? [reason, reason];
      return `${n} ${n === 1 ? one : many}`;
    })
    .join(", ");
  const bars = result.items.filter(
    (i) => i.displayFormat === ColumnDisplayFormat.Percentage,
  ).length;
  const parties = result.items.filter((i) => i.barColor).length;
  const pinned = result.items.filter((i) => i.pinned).length;
  return [
    `Kept ${result.items.length} of ${result.items.length + result.hidden.length} columns.`,
    hidden && `Hid ${hidden}.`,
    bars > 0 && `${bars} shown as percentage bars.`,
    parties > 0 && `${parties} in party colours.`,
    pinned > 0 && `Pinned ${pinned} on the map.`,
  ]
    .filter(Boolean)
    .join(" ");
};

// Reads a sample of the source's records and rewrites the section's columns,
// formats and layout to suit them, with an undo
export default function InspectorAutoScan({
  config,
  onUpdate,
  onPatchColumnMetadata,
  compact = false,
}: {
  config: InspectorConfig;
  onUpdate: (config: InspectorConfig) => void;
  onPatchColumnMetadata: (
    column: string,
    patch: { semanticType: ColumnSemanticType },
  ) => void;
  /** A slim row under the Columns heading, for the narrow flyout */
  compact?: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { getDataSourceById } = useDataSources();
  const { items: visualisations } = useSavedVisualisations();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<{
    previous: InspectorConfig;
    summary: string;
  } | null>(null);

  const scan = async () => {
    const dataSource = getDataSourceById(config.dataSourceId);
    if (!dataSource) return;
    setIsScanning(true);
    setError(null);
    try {
      const records = await queryClient.fetchQuery(
        trpc.dataRecord.sample.queryOptions({
          dataSourceId: config.dataSourceId,
          limit: SAMPLE_SIZE,
        }),
      );
      const result = scanInspectorColumns({
        columnDefs: dataSource.columnDefs,
        columnMetadata: dataSource.columnMetadata,
        samples: records.map((record) => record.json),
        geocodingConfig: dataSource.geocodingConfig,
        priorityColumns: visualisations
          .filter((v) => v.areaDataSourceId === config.dataSourceId)
          .flatMap((v) => [v.areaDataColumn, v.areaDataSecondaryColumn])
          .filter((c): c is string => Boolean(c) && c !== DUMMY_COUNT_COLUMN),
      });
      result.metadataPatches.forEach(({ column, semanticType }) =>
        onPatchColumnMetadata(column, { semanticType }),
      );
      onUpdate({ ...config, items: result.items, layout: result.layout });
      setLastScan({ previous: config, summary: summarise(result) });
    } catch {
      setError("Couldn't read this data source's records.");
    } finally {
      setIsScanning(false);
    }
  };

  const undo = () => {
    if (!lastScan) return;
    onUpdate(lastScan.previous);
    setLastScan(null);
  };

  const result = (
    <>
      {error && <p className="text-xs text-red-700">{error}</p>}
      {lastScan && (
        <div className="flex items-start gap-2 rounded-md bg-neutral-100 px-2 py-1.5 text-xs text-neutral-700">
          <p className="min-w-0 flex-1">{lastScan.summary}</p>
          <button
            type="button"
            onClick={undo}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded px-1 text-neutral-500 hover:bg-white hover:text-neutral-900"
          >
            <Undo2Icon className="size-3" />
            Undo
          </button>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={scan}
          disabled={isScanning}
          title="Look at this source's records and pick the columns and formats for you"
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-default disabled:opacity-60"
        >
          {isScanning ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <SparklesIcon className="size-3.5" />
          )}
          {isScanning ? "Scanning records…" : "Auto-scan columns"}
        </button>
        {result}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-xs text-neutral-500">
          Look at this source&apos;s records and pick the columns and formats
          for you.
        </p>
        <button
          type="button"
          onClick={scan}
          disabled={isScanning}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:cursor-default disabled:opacity-60"
        >
          {isScanning ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <SparklesIcon className="size-3.5" />
          )}
          {isScanning ? "Scanning…" : "Auto-scan"}
        </button>
      </div>
      {result}
    </div>
  );
}
