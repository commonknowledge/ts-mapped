import { ColumnDef, LooseGeocodingConfig } from "@/__generated__/types";
import DataSourceBadge from "@/components/DataSourceBadge";
import { DataSourceType } from "@/types";

interface DataSource {
  id: string;
  config: {
    type: DataSourceType;
  };
  name: string;
  public: boolean;
  columnDefs: ColumnDef[];
  geocodingConfig: LooseGeocodingConfig;
  recordCount?: {
    count: number;
  } | null;
  autoImport: boolean;
}

// Helper function to get data source type from config
const getDataSourceType = (
  dataSource: DataSource,
): DataSourceType | "unknown" => {
  try {
    const config = dataSource.config;
    return config?.type || "unknown";
  } catch {
    return "unknown";
  }
};

export default function DataSourceCard({
  dataSource,
  isSelected,
  onClick,
}: {
  dataSource: DataSource;
  isSelected: boolean;
  onClick: () => void;
}) {
  const dataSourceType = getDataSourceType(dataSource);

  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium truncate">{dataSource.name}</h3>
        <p className="text-sm text-muted-foreground">
          {dataSource.recordCount?.count || "Unknown number of"} records
        </p>
        <div className="flex gap-2">
          {dataSourceType !== "unknown" && (
            <DataSourceBadge type={dataSourceType} />
          )}
        </div>
      </div>
    </div>
  );
}
