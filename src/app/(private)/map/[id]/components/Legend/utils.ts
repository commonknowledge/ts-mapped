import { DUMMY_COUNT_COLUMN, MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { ColumnType } from "@/models/DataSource";
import type { ColumnDef, ColumnMetadata } from "@/models/DataSource";
import type { ComboboxOption } from "@/shadcn/ui/combobox";

/**
 * The column picker's options, in groups: the source's suggested column
 * first (a library source's default), then summaries, numbers and text.
 */
export const getColumnOptions = ({
  columnDefs,
  columnMetadata,
  suggestedColumn,
}: {
  columnDefs: ColumnDef[];
  columnMetadata: ColumnMetadata[];
  suggestedColumn?: string | null;
}): ComboboxOption[] => {
  const toOption = (col: ColumnDef, group: string): ComboboxOption => ({
    value: col.name,
    label: col.name,
    hint: columnMetadata.find((m) => m.name === col.name)?.description,
    group,
  });
  const suggested = columnDefs.find((col) => col.name === suggestedColumn);
  const rest = columnDefs.filter((col) => col !== suggested);
  return [
    { value: NULL_UUID, label: "None" },
    ...(suggested ? [toOption(suggested, "Suggested")] : []),
    { value: DUMMY_COUNT_COLUMN, label: "Count", group: "Summaries" },
    {
      value: MAX_COLUMN_KEY,
      label: "Highest value column",
      group: "Summaries",
    },
    ...rest
      .filter((col) => col.type === ColumnType.Number)
      .map((col) => toOption(col, "Numbers")),
    ...rest
      .filter((col) => col.type !== ColumnType.Number)
      .map((col) => toOption(col, "Text")),
  ];
};
