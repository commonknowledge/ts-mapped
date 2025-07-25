import DataListRow from "@/components/DataListRow";
import { Input } from "@/shadcn/ui/input";
import { DataSourceType } from "@/types";
import { NewDataSourceConfig } from "../types";

export default function ActionNetworkFields({
  config,
  onChange,
}: {
  config: Partial<NewDataSourceConfig>;
  onChange: (config: Partial<NewDataSourceConfig>) => void;
}) {
  if (config.type !== DataSourceType.actionnetwork) {
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
