import { DUMMY_COUNT_COLUMN } from "@/constants";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";

export function PropertyLabel({
  column,
  dataSourceId,
}: {
  column: string;
  dataSourceId?: string;
}) {
  const { columnMetadata: metadata } = useDataSourceColumn(
    dataSourceId,
    column,
  );

  const label =
    column === DUMMY_COUNT_COLUMN ? "Count" : metadata?.displayName || column;

  return (
    <dt className="mb-[2px] text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
      {label}
    </dt>
  );
}
