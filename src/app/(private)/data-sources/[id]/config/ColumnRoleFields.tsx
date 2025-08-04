import { DataSourceConfigQuery } from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
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
    <DataListRow label="Name columns">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {nameColumns.length ? nameColumns.join(", ") : "Select"}
          </Button>
        </DropdownMenuTrigger>
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
      </DropdownMenu>
    </DataListRow>
  );
}
