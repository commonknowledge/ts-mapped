import { useMemo } from "react";
import { resolveColumnMetadata } from "@/utils/resolveColumnMetadata";
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
  const metadata = useMemo(
    () =>
      resolveColumnMetadata(
        dataSource?.columnMetadata || [],
        dataSource?.columnMetadataOverride,
      ),
    [dataSource?.columnMetadata, dataSource?.columnMetadataOverride],
  );
  const properties = useMemo(() => {
    const filtered: { column: string; value: string }[] = [];
    columns.forEach((columnName) => {
      if (json[columnName] !== undefined) {
        const columnMetadata = metadata.find((m) => m.name === columnName);
        filtered.push({
          column: columnName,
          value: getDisplayValue(
            json[columnName],
            {
              columnType: dataSource?.columnDefs?.find(
                (cd) => cd.name === columnName,
              )?.type,
            },
            columnMetadata?.valueLabels,
          ),
        });
      }
    });
    return filtered;
  }, [columns, dataSource?.columnDefs, json, metadata]);

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
