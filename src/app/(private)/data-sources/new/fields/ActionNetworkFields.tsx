import DataListRow from "@/components/DataListRow";
import {
  DataSourceType,
  NewDataSourceConfig,
} from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";

export default function ActionNetworkFields({
  config,
  onChange,
}: {
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.ActionNetwork) {
    return;
  }

  return (
    <DataListRow label="API Key">
      <Input
        type="text"
        placeholder="API Key"
        value={config.apiKey || ""}
        onChange={(e) => onChange({ apiKey: e.target.value })}
      />
    </DataListRow>
  );
}
