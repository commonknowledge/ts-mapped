import { DataSource } from "@/__generated__/types";
import { Check, Database } from "lucide-react";
import { DataSourceType } from "@/types";
import DataSourceIcon from "./DataSourceIcon";

// Helper function to get data source type from config
const getDataSourceType = (dataSource: DataSource): DataSourceType | 'unknown' => {
    try {
        const config = dataSource.config as any;
        return config?.type || 'unknown';
    } catch {
        return 'unknown';
    }
};

// Helper function to get appropriate color and label for data source type
const getDataSourceStyle = (type: DataSourceType | 'unknown') => {
    switch (type) {
        case DataSourceType.actionnetwork:
            return {
                bgColor: "from-green-400 to-blue-500",
                label: "Action Network",
                description: "Activist and supporter data"
            };
        case DataSourceType.airtable:
            return {
                bgColor: "from-orange-400 to-red-500",
                label: "Airtable",
                description: "Database and spreadsheet data"
            };
        case DataSourceType.csv:
            return {
                bgColor: "from-gray-400 to-gray-600",
                label: "CSV",
                description: "Comma-separated values data"
            };
        case DataSourceType.googlesheets:
            return {
                bgColor: "from-green-500 to-green-700",
                label: "Google Sheets",
                description: "Spreadsheet data from Google"
            };
        case DataSourceType.mailchimp:
            return {
                bgColor: "from-yellow-400 to-orange-500",
                label: "Mailchimp",
                description: "Email marketing and subscriber data"
            };
        default:
            return {
                bgColor: "from-blue-400 to-purple-500",
                label: "Data Source",
                description: "General data source"
            };
    }
};

// Helper function to get geocoding status
const getGeocodingStatus = (dataSource: DataSource) => {
    const geocodingConfig = dataSource.geocodingConfig;
    if (geocodingConfig.type === 'None') {
        return { status: 'No geocoding', color: 'text-gray-500' };
    }
    if (geocodingConfig.type === 'Address') {
        return { status: 'Address geocoding', color: 'text-green-600' };
    }
    if (geocodingConfig.type === 'Code' || geocodingConfig.type === 'Name') {
        return { status: 'Area-based geocoding', color: 'text-blue-600' };
    }
    return { status: 'Geocoding configured', color: 'text-blue-600' };
};

export default function DataSourceItem({
    dataSource,
    isSelected,
    onClick,
}: {
    dataSource: DataSource;
    isSelected: boolean;
    onClick: () => void;
}) {
    const dataSourceType = getDataSourceType(dataSource);
    const style = getDataSourceStyle(dataSourceType);
    const geocodingStatus = getGeocodingStatus(dataSource);

    return (
        <div
            className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* Data Source Icon/Preview */}
                <div className={`w-10 h-10 bg-gradient-to-br ${style.bgColor} rounded-lg flex items-center justify-center text-white`}>
                    {dataSourceType !== 'unknown' ? (
                        <DataSourceIcon type={dataSourceType} />
                    ) : (
                        <Database className="w-4 h-4" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{dataSource.name}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {style.label}
                        </span>
                        {dataSource.public && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Public
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-600 mb-1">
                        {style.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-600">
                        <span>{dataSource.columnDefs.length} columns</span>
                        <span className="text-gray-400">•</span>
                        <span>{dataSource.recordCount || "Unknown"} records</span>
                        <span className="text-gray-400">•</span>
                        <span className={geocodingStatus.color}>{geocodingStatus.status}</span>
                    </div>

                    {/* Additional metadata based on type */}
                    {dataSourceType === DataSourceType.actionnetwork && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Activist engagement data</span>
                        </div>
                    )}

                    {dataSourceType === DataSourceType.mailchimp && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Email subscriber data</span>
                        </div>
                    )}

                    {dataSource.autoImport && (
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                <Database className="w-3 h-3" />
                                Auto-import enabled
                            </span>
                        </div>
                    )}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}