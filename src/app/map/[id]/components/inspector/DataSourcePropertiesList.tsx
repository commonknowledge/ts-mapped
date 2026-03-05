import { useMemo } from "react";
import { getDisplayValue } from "../../utils/stats";
import ColumnMetadataIcons from "../ColumnMetadataIcons";
import type { DataSource } from "@/server/models/DataSource";

export default function DataSourcePropertiesList({
  dataSource,
  json,
  onlyColumns,
}: {
  dataSource: DataSource | null | undefined;
  json: Record<string, unknown>;
  onlyColumns?: string[] | null | undefined;
}) {
  const columns = onlyColumns || Object.keys(json);
  const properties = useMemo(() => {
    const filtered: { column: string; value: string }[] = [];
    columns.forEach((columnName) => {
      if (json[columnName] !== undefined) {
        const metadata = dataSource?.columnMetadata?.find(
          (c) => c.name === columnName,
        );
        filtered.push({
          column: columnName,
          value: getDisplayValue(
            json[columnName],
            {
              columnType: dataSource?.columnDefs?.find(
                (cd) => cd.name === columnName,
              )?.type,
            },
            metadata?.valueLabels,
          ),
        });
      }
    });
    return filtered;
  }, [columns, dataSource, json]);

  if (!properties.length) {
    return <p className="text-sm">No data available</p>;
  }

  return (
    <dl className="flex flex-col gap-3">
      {properties.map(({ column, value }, i) => {
        return (
          <div key={`${column}-${i}`}>
            <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
              {column}
              <ColumnMetadataIcons column={column} dataSource={dataSource} />
            </dt>
            <dd className="font-medium">{String(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
