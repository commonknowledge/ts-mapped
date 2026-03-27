import { DUMMY_COUNT_COLUMN } from "@/constants";
import ColumnMetadataIcons from "../ColumnMetadataIcons";
import type { EditColumnMetadataFields } from "../../atoms/editColumnMetadataAtom";
import type { ColumnMetadata } from "@/models/DataSource";

export function PropertyLabel({
  column,
  metadata,
  dataSourceId,
  showSettings = true,
  fields = { description: true },
}: {
  column: string;
  metadata?: ColumnMetadata;
  dataSourceId?: string;
  showSettings?: boolean;
  fields?: EditColumnMetadataFields;
}) {
  const label =
    column === DUMMY_COUNT_COLUMN ? "Count" : metadata?.displayName || column;

  return (
    <dt className="mb-[2px] text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
      {label}
      <ColumnMetadataIcons
        column={column}
        dataSourceId={dataSourceId}
        metadata={metadata}
        showSettings={showSettings}
        iconColorClass="text-muted-foreground"
        fields={fields}
      />
    </dt>
  );
}
