import DataListRow from "@/components/DataListRow";
import { Input } from "@/shadcn/ui/input";
import { DataSourceType } from "@/types";
import { NewDataSourceConfig } from "../types";

export default function CSVInputs({
  config,
  onChange,
}: {
  config: NewDataSourceConfig;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.csv) {
    return;
  }

  return (
    <>
      <DataListRow label="ID Column">
        <Input
          type="text"
          placeholder="ID Column"
          value={config.idColumn || ""}
          onChange={(e) => onChange({ idColumn: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="File">
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files ? e.target.files[0] : null;
            if (file) {
              onChange({ file, filename: file.name });
            } else {
              onChange({ file: null, filename: "" });
            }
          }}
        />
      </DataListRow>
    </>
  );
}
