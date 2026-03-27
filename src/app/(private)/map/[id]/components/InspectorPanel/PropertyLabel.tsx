import { DUMMY_COUNT_COLUMN } from "@/constants";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import ColumnMetadataIcons from "../ColumnMetadataIcons";
import type { EditColumnMetadataFields } from "../../atoms/editColumnMetadataAtom";

export function PropertyLabel({
  column,
  dataSourceId,
  showSettings = true,
  fields = { description: true },
}: {
  column: string;
  dataSourceId?: string;
  showSettings?: boolean;
  fields?: EditColumnMetadataFields;
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
      <ColumnMetadataIcons
        column={column}
        dataSourceId={dataSourceId}
        showSettings={showSettings}
        iconColorClass="text-muted-foreground"
        fields={fields}
      />
    </dt>
  );
}
