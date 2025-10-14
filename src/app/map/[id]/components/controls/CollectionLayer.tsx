import { Table } from "lucide-react";
import React from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import LayerItem from "./LayerItem";
import type { DataSourceType } from "@/server/models/DataSource";

export default function CollectionLayer({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: {
  dataSource: {
    id: string;
    name: string;
    config: { type: DataSourceType };
    recordCount?: number;
    createdAt?: Date;
  };
  isSelected: boolean;
  onClick: () => void;
  handleDataSourceSelect: (id: string) => void;
  layerType: string;
}) {
  return (
    <LayerItem
      onClick={() => handleDataSourceSelect(dataSource.id)}
      layerType={layerType === "member" ? "members" : "locations"}
      className={isSelected ? "ring-2 ring-blue-500" : ""}
      isDataSource={true}
      dataSourceId={dataSource.id}
    >
      <DataSourceIcon type={dataSource.config.type} />
      <div className="flex-1">
        <div className="text-sm font-medium">{dataSource.name}</div>
        <div className="text-xs text-neutral-500">
          {dataSource.recordCount?.toLocaleString() || "0"} records
          {dataSource.createdAt &&
            ` • Created ${new Date(dataSource.createdAt).toLocaleDateString()}`}
        </div>
      </div>
      {isSelected && <Table className="w-4 h-4 text-neutral-500" />}
    </LayerItem>
  );
}
