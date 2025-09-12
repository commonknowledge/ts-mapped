import { DataSourceTypeLabels } from "@/labels";
import { Badge } from "@/shadcn/ui/badge";
import DataSourceIcon from "./DataSourceIcon";
import type { DataSourceType } from "@/server/models/DataSource";

export default function DataSourceBadge({ type }: { type: DataSourceType }) {
  return (
    <Badge variant="secondary" className="flex items-center gap-2 text-sm">
      <DataSourceIcon type={type} />
      {DataSourceTypeLabels[type] || type}
    </Badge>
  );
}
