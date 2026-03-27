import { useMemo } from "react";
import { useDataSourceColumns } from "../../hooks/useDataSourceColumn";
import { getDisplayValue } from "../../utils/stats";
import { PropertyLabel } from "./PropertyLabel";
import type { ColumnMetadata } from "@/models/DataSource";

export function SimpleRecordProperties({
  json,
  dataSourceId,
  onlyColumns,
}: {
  json: Record<string, unknown>;
  dataSourceId?: string;
  onlyColumns?: string[] | null;
}) {
  const columns = onlyColumns || Object.keys(json);
  const { columnDefs, columnMetadata } = useDataSourceColumns(dataSourceId);

  const properties = useMemo(() => {
    const filtered: {
      column: string;
      value: string;
      metadata?: ColumnMetadata;
    }[] = [];
    columns.forEach((columnName) => {
      if (json[columnName] !== undefined) {
        const metadata = columnMetadata.find((m) => m.name === columnName);
        filtered.push({
          column: columnName,
          value: getDisplayValue(json[columnName], {
            columnType: columnDefs?.find((cd) => cd.name === columnName)?.type,
            columnMetadata: metadata,
            calculationType: null,
          }),
          metadata,
        });
      }
    });
    return filtered;
  }, [columns, columnDefs, json, columnMetadata]);

  if (!properties.length) {
    return <p className="text-sm">No data</p>;
  }

  return (
    <dl className="flex flex-col gap-3">
      {properties.map(({ column, value }, i) => (
        <div key={`${column}-${i}`}>
          <PropertyLabel
            column={column}
            dataSourceId={dataSourceId}
            fields={{ description: true, valueLabels: true }}
          />
          <dd className="font-medium">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
