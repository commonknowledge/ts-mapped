import DataListRow from "@/components/DataListRow";
import {
  DataSourceType,
  NewDataSourceConfig,
} from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";

export default function CSVFields({
  config,
  onChange,
}: {
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.CSV) {
    return;
  }

  return (
    <>
      <DataListRow label="File">
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files ? e.target.files[0] : null;
            if (file) {
              onChange({ file, filename: file.name });
            } else {
              onChange({ file: undefined, filename: "" });
            }
          }}
        />
      </DataListRow>
    </>
  );
}
