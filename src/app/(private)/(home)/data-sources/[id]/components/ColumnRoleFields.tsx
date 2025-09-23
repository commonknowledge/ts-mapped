import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import type { RouterOutputs } from "@/services/trpc/react";

export function ColumnRoleFields({
  dataSource,
  nameColumns,
  setNameColumns,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  nameColumns: string[];
  setNameColumns: (ncs: string[]) => void;
}) {
  const onChange = (currentValue: string) => {
    if (nameColumns.some((c) => c === currentValue)) {
      setNameColumns(nameColumns.filter((c) => c !== currentValue));
    } else {
      setNameColumns(nameColumns.concat([currentValue]));
    }
  };

  return (
    <CustomMultiSelect
      id="config-name-columns-multi"
      label="Name columns"
      hint="Select one or more fields to use as labels on the map."
      allOptions={dataSource?.columnDefs.map((cd) => cd.name)}
      selectedOptions={nameColumns}
      onChange={onChange}
    ></CustomMultiSelect>
  );
}
