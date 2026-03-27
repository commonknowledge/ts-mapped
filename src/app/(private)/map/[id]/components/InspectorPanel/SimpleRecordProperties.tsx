import { useMemo } from "react";
import { getDisplayValue } from "../../utils/stats";
import { PropertyLabel } from "./PropertyLabel";
import type { ColumnDef, ColumnMetadata } from "@/models/DataSource";

export function SimpleRecordProperties({
  json,
  resolvedMetadata,
  columnDefs,
  dataSourceId,
  onlyColumns,
}: {
  json: Record<string, unknown>;
  resolvedMetadata: ColumnMetadata[];
  columnDefs?: ColumnDef[];
  dataSourceId?: string;
  onlyColumns?: string[] | null;
}) {
  const columns = onlyColumns || Object.keys(json);

  const properties = useMemo(() => {
    const filtered: {
      column: string;
      value: string;
      metadata?: ColumnMetadata;
    }[] = [];
    columns.forEach((columnName) => {
      if (json[columnName] !== undefined) {
        const columnMetadata = resolvedMetadata.find(
          (m) => m.name === columnName,
        );
        filtered.push({
          column: columnName,
          value: getDisplayValue(json[columnName], {
            columnType: columnDefs?.find((cd) => cd.name === columnName)?.type,
            columnMetadata,
            calculationType: null,
          }),
          metadata: columnMetadata,
        });
      }
    });
    return filtered;
  }, [columns, columnDefs, json, resolvedMetadata]);

  if (!properties.length) {
    return <p className="text-sm">No data</p>;
  }

  return (
    <dl className="flex flex-col gap-3">
      {properties.map(({ column, value, metadata }, i) => (
        <div key={`${column}-${i}`}>
          <PropertyLabel
            column={column}
            metadata={metadata}
            dataSourceId={dataSourceId}
            fields={{ description: true, valueLabels: true }}
          />
          <dd className="font-medium">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
