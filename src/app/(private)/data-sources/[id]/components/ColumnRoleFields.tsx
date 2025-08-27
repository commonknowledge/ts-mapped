import { DataSourceConfigQuery } from "@/__generated__/types";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "@/shadcn/ui/dropdown-menu";

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
    <CustomMultiSelect
      id="config-name-columns-multi"
      label="Name columns"
      selectedOptions={nameColumns}
    >
      <DropdownMenuContent>
        {dataSource?.columnDefs.map((cd) => (
          <DropdownMenuCheckboxItem
            key={cd.name}
            checked={nameColumns.includes(cd.name)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => {
              if (checked) {
                setNameColumns(nameColumns.concat([cd.name]));
              } else {
                setNameColumns(nameColumns.filter((c) => c !== cd.name));
              }
            }}
          >
            {cd.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </CustomMultiSelect>
  );
}
