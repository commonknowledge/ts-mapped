import DataListRow from "@/components/DataListRow";
import { DataSourceType } from "@/server/models/DataSource";
import { Input } from "@/shadcn/ui/input";
import type { ActionNetworkConfig } from "@/server/models/DataSource";

export default function ActionNetworkFields({
  config,
  onChange,
}: {
  config: Partial<ActionNetworkConfig>;
  onChange: (config: Partial<Pick<ActionNetworkConfig, "apiKey">>) => void;
}) {
  if (config.type !== DataSourceType.ActionNetwork) return;

  return (
    <DataListRow label="API Key" name="apiKey">
      <Input
        type="text"
        required
        className="w-50"
        id="apiKey"
        placeholder="API Key"
        value={config.apiKey || ""}
        onChange={(e) => onChange({ apiKey: e.target.value })}
      />
    </DataListRow>
  );
}
