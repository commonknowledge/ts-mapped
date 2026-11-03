"use client";

import { useDataSources } from "@/hooks/useDataSources";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { useRecordName } from "../../hooks/useRecordName";

const DEFAULT_VALUE = "__default__";
const HINT = "Used when an area has several records from this source.";

// Which column names each record when an area has several of them
export default function RecordNameColumnSelect({
  dataSourceId,
  compact = false,
}: {
  dataSourceId: string;
  /** Smaller, with the explanation on hover */
  compact?: boolean;
}) {
  const { getDataSourceById } = useDataSources();
  const { nameColumn, setNameColumn } = useRecordName(dataSourceId);
  const dataSource = getDataSourceById(dataSourceId);
  if (!dataSource) return null;

  const defaultLabel = dataSource.columnRoles.nameColumns.length
    ? `Default (${dataSource.columnRoles.nameColumns.join(", ")})`
    : "Default (record ID)";

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <Label
        className={cn(
          "text-muted-foreground",
          compact && "text-[11px] font-normal",
        )}
        title={compact ? HINT : undefined}
      >
        Name records by
      </Label>
      <Select
        value={nameColumn ?? DEFAULT_VALUE}
        onValueChange={(value) =>
          setNameColumn(value === DEFAULT_VALUE ? null : value)
        }
      >
        <SelectTrigger
          className={cn(
            "w-full min-w-0 truncate",
            compact ? "h-8 text-xs" : "h-9",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_VALUE}>{defaultLabel}</SelectItem>
          {dataSource.columnDefs.map((col) => (
            <SelectItem key={col.name} value={col.name}>
              {dataSource.columnMetadata.find((m) => m.name === col.name)
                ?.displayName || col.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && <p className="text-xs text-muted-foreground">{HINT}</p>}
    </div>
  );
}
