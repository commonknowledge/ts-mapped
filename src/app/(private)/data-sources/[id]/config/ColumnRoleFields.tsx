import { DataSourceConfigQuery } from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

export default function ColumnRoleFields({
  dataSource,
  nameColumn,
  setNameColumn,
}: {
  dataSource: DataSourceConfigQuery["dataSource"];
  nameColumn: string;
  setNameColumn: (nc: string) => void;
}) {
  return (
    <DataListRow label="Name column">
      <Select value={nameColumn} onValueChange={setNameColumn}>
        <SelectTrigger className="w-[360px]">
          <SelectValue placeholder="Select a name column" />
        </SelectTrigger>
        <SelectContent>
          {dataSource?.columnDefs.map((cd) => (
            <SelectItem key={cd.name} value={cd.name}>
              {cd.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DataListRow>
  );
}
