"use client";

import { XIcon, Filter, TagIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Badge } from "@/shadcn/ui/badge";
import TagInfoModal from "./TagInfoModal";
import type { DataSource } from "@/server/models/DataSource";
import type { DataSourceView } from "@/server/models/MapView";
import DataSourceIcon from "@/components/DataSourceIcon";

interface TagConfigSidebarProps {
    tagLabel: string;
    setTagLabel: (label: string) => void;
    dataSource: DataSource;
    dataSourceView?: DataSourceView;
    onSendTag: () => void;
}

export default function TagConfigSidebar({
    tagLabel,
    setTagLabel,
    dataSource,
    dataSourceView,
    onSendTag,
}: TagConfigSidebarProps) {
    // Debug: Log the filter structure to understand what we're working with
    console.log('TagConfigSidebar - dataSourceView filter:', dataSourceView?.filter);

    const hasFilters = dataSourceView?.filter && (
        // Check if filter has children (nested filters)
        (dataSourceView.filter.children && dataSourceView.filter.children.length > 0) ||
        // Check if filter has actual filter criteria (not just MULTI type)
        (dataSourceView.filter.type !== "MULTI" && (
            dataSourceView.filter.column ||
            dataSourceView.filter.search ||
            dataSourceView.filter.turf ||
            dataSourceView.filter.placedMarker ||
            dataSourceView.filter.dataRecordId
        ))
    );

    return (
        <div className="w-80 shrink-0 bg-purple-50 border-r border-neutral-200 p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-sm flex items-center justify-center text-white">
                        <TagIcon className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-semibold">Tag Configuration</h2>
                </div>
                <TagInfoModal />
            </div>

            {/* Data Source */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-900">Data Source</h3>
                <div className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50">
                    <DataSourceIcon type={dataSource.config?.type as string} />
                    <span className="text-sm text-neutral-900">{dataSource.name}</span>
                </div>
            </div>

            {/* Segmentation Settings */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-900">Segmentation Settings</h3>
                {hasFilters ? (
                    <div className="flex flex-wrap gap-2">
                        {/* Show children filters if they exist */}
                        {dataSourceView?.filter.children?.map((filter, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-50 border-neutral-300 hover:bg-neutral-100">
                                {filter.label || `${filter.column || 'Field'} ${filter.operator || 'is'} ${filter.search || filter.turf || filter.placedMarker || 'value'}`}
                                <XIcon className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500 flex-shrink-0" />
                            </Badge>
                        ))}
                        {/* Show direct filter if no children but has filter criteria */}
                        {(!dataSourceView?.filter.children || dataSourceView.filter.children.length === 0) && (
                            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-50 border-neutral-300 hover:bg-neutral-100">
                                {dataSourceView?.filter.label || `${dataSourceView?.filter.column || 'Field'} ${dataSourceView?.filter.operator || 'is'} ${dataSourceView?.filter.search || dataSourceView?.filter.turf || dataSourceView?.filter.placedMarker || 'value'}`}
                                <XIcon className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500 flex-shrink-0" />
                            </Badge>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2 items-center border-1 border-dashed border-neutral-300 rounded-lg p-2 ">
                        <Filter className="w-12 h-12 text-neutral-400" />
                        <p className="text-sm text-neutral-500">
                            No filters configured. Add filters in the table section on the right.
                        </p>
                    </div>
                )}
            </div>

            {/* Tag Label */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-900">Tag Label</h3>
                <Input
                    value={tagLabel}
                    onChange={(e) => setTagLabel(e.target.value)}
                    className="w-full border-neutral-300 focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-neutral-200">
                <Button
                    onClick={onSendTag}
                    disabled={!hasFilters}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                    Tag Records Shown in Table
                </Button>
                {!hasFilters && (
                    <p className="text-xs text-neutral-500 text-center mt-2">
                        Add filters to enable tagging
                    </p>
                )}
            </div>
        </div>
    );
}
