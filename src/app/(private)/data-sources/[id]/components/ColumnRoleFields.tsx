import { ChevronDown } from "lucide-react";
import { DataSourceConfigQuery } from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
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
    <FormFieldWrapper label="Name columns">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="justify-between font-normal hover:bg-white cursor-auto"
          >
            <span>
              {nameColumns.length ? nameColumns.join(", ") : "Select"}
            </span>
            <ChevronDown className="text-muted-foreground opacity-50" />
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
    </FormFieldWrapper>
  );
}
