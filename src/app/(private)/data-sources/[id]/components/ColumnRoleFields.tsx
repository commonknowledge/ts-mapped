import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import CustomSelect from "@/components/forms/CustomSelect";
import type { RouterOutputs } from "@/services/trpc/react";

export function ColumnRoleFields({
  dataSource,
  nameColumns,
  setNameColumns,
  dateColumn,
  setDateColumn,
  dateFormat,
  setDateFormat,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  nameColumns: string[];
  setNameColumns: (ncs: string[]) => void;
  dateColumn: string;
  setDateColumn: (dc: string) => void;
  dateFormat: string;
  setDateFormat: (dc: string) => void;
}) {
  const onChange = (currentValue: string) => {
    if (nameColumns.some((c) => c === currentValue)) {
      setNameColumns(nameColumns.filter((c) => c !== currentValue));
    } else {
      setNameColumns(nameColumns.concat([currentValue]));
    }
  };

  return (
    <>
      <CustomMultiSelect
        id="config-name-columns-multi"
        label="Name columns"
        hint="Select one or more fields to use as labels on the map."
        allOptions={dataSource?.columnDefs.map((cd) => cd.name)}
        selectedOptions={nameColumns}
        onChange={onChange}
      />
      <CustomSelect
        id="config-date-column"
        label="Date column"
        hint="Select a field to use as the date for a record."
        value={dateColumn}
        options={dataSource?.columnDefs.map((cd) => ({
          label: cd.name,
          value: cd.name,
        }))}
        onValueChange={(v) => setDateColumn(v)}
      />
      <CustomSelect
        id="config-date-format"
        label="Date format"
        hint="Select a date format (if yours is not listed, contact us)."
        value={dateFormat}
        options={[
          {
            label: "ISO Format (YYYY-MM-DD)",
            value: "yyyy-MM-dd",
          },
          {
            label: "UK Format (DD/MM/YYYY)",
            value: "dd/MM/yyyy",
          },
          {
            label: "US Format (MM/DD/YYYY)",
            value: "MM/dd/yyyy",
          },
        ]}
        onValueChange={(v) => setDateFormat(v)}
      />
    </>
  );
}
