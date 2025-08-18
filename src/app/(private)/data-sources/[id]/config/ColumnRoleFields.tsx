import { DataSourceConfigQuery } from "@/__generated__/types";
import ColumnsMultiSelect from "@/components/ColumnsMultiSelect";
import DataListRow from "@/components/DataListRow";

export default function ColumnRoleFields({
  dataSource,
  nameColumns,
  setNameColumns,
}: {
  dataSource: DataSourceConfigQuery["dataSource"];
  nameColumns: string[];
  setNameColumns: (ncs: string[]) => void;
}) {
  return (
    <DataListRow label="Name columns">
      <ColumnsMultiSelect
        columns={nameColumns}
        columnDefs={dataSource?.columnDefs || []}
        onChange={(c) => setNameColumns(c)}
      />
    </DataListRow>
  );
}
