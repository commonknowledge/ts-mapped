import { useMemo } from "react";
import { resolveColumnMetadataEntry } from "@/utils/resolveColumnMetadata";
import { getDisplayValue } from "../../utils/stats";
import ColumnMetadataIcons from "../ColumnMetadataIcons";
import type { ColumnMetadata, ColumnType } from "@/server/models/DataSource";

export default function DataSourcePropertiesList({
  dataSource,
  json,
  onlyColumns,
}: {
  dataSource:
    | {
        columnMetadata: ColumnMetadata[];
        columnMetadataOverride?: ColumnMetadata[] | null;
        columnDefs?: { name: string; type: ColumnType }[];
        id: string;
      }
    | null
    | undefined;
  json: Record<string, unknown>;
  onlyColumns?: string[] | null | undefined;
}) {
  const columns = onlyColumns || Object.keys(json);
  const properties = useMemo(() => {
    const filtered: { column: string; value: string }[] = [];
    columns.forEach((columnName) => {
      if (json[columnName] !== undefined) {
        const metadata = resolveColumnMetadataEntry(
          dataSource?.columnMetadata ?? [],
          dataSource?.columnMetadataOverride,
          columnName,
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
            <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono flex items-center gap-0.5">
              {column}
              <ColumnMetadataIcons
                column={column}
                dataSource={dataSource}
                iconColorClass="text-muted-foreground"
              />
            </dt>
            <dd className="font-medium">{String(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
