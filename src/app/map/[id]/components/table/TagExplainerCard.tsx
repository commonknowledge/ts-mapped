"use client";

import { Filter, Lock, TagIcon } from "lucide-react";
import { getFilterDescription } from "@/app/map/[id]/utils/filterDescriptions";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import type { DataSource } from "@/server/models/DataSource";
import type { DataSourceView } from "@/server/models/MapView";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

interface TagExplainerCardProps {
  onConfigureTag: () => void;
  onResendTags: () => void;
  dataSource?: DataSource;
  dataSourceView?: DataSourceView;
  viewName?: string;
  placedMarkers?: PlacedMarker[];
}

export default function TagExplainerCard({
  onConfigureTag,
  onResendTags,
  dataSource,
  dataSourceView,
  viewName,
  placedMarkers = [],
}: TagExplainerCardProps) {
  const hasFilters =
    dataSourceView?.filter &&
    // Check if filter has children (nested filters)
    ((dataSourceView.filter.children &&
      dataSourceView.filter.children.length > 0) ||
      // Check if filter has actual filter criteria (not just MULTI type)
      (dataSourceView.filter.type !== "MULTI" &&
        (dataSourceView.filter.column ||
          dataSourceView.filter.search ||
          dataSourceView.filter.turf ||
          dataSourceView.filter.placedMarker ||
          dataSourceView.filter.dataRecordId)));

  return (
    <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-4 max-w-xs">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 bg-purple-600 rounded-sm flex items-center justify-center text-white">
          <TagIcon className="w-4 h-4" />
        </div>

        <h2 className="text-lg font-semibold">Tag View</h2>
        <div className="flex items-center gap-2"></div>
      </div>

      <p className="text-xs text-neutral-700 mb-4">
        This is a tag view, used to segment your audience records in your data
        source based on a set of filters. Open the table panel to configure tag
        settings and send tags to your data source.
      </p>

      {/* Tag Configuration Preview */}
      {dataSource && (
        <div className="space-y-3 mb-4">
          {/* Data Source */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Data Source
            </h3>
            <div className="flex items-center gap-2 px-2 py-1 border border-neutral-200 rounded text-xs bg-neutral-50">
              <DataSourceIcon type={dataSource.config?.type as string} />
              <span className="text-neutral-700">{dataSource.name}</span>
            </div>
          </div>

          {/* Segmentation Settings */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Targeting Records based on:
            </h3>
            {hasFilters ? (
              <div className="flex flex-wrap gap-1">
                {/* Show children filters if they exist */}
                {dataSourceView?.filter.children?.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 px-1 py-0.5 text-xs bg-neutral-50 border-neutral-300"
                  >
                    {getFilterDescription(filter, placedMarkers)}
                  </Badge>
                ))}
                {/* Show direct filter if no children but has filter criteria */}
                {(!dataSourceView?.filter.children ||
                  dataSourceView.filter.children.length === 0) && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 px-1 py-0.5 text-xs bg-neutral-50 border-neutral-300"
                  >
                    {getFilterDescription(
                      dataSourceView?.filter,
                      placedMarkers,
                    )}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex gap-2 items-center border border-dashed border-neutral-300 rounded p-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <p className="text-xs text-neutral-500">
                  No filters configured
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Label Settings */}
      <div className="space-y-1 mb-4">
        <h3 className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
          Tag Label
        </h3>
        <div className="flex items-center gap-2 px-2 py-1 border border-neutral-200 rounded text-xs bg-neutral-50">
          <span className="text-neutral-700">{viewName}</span>
          <Lock className="w-3 h-3 text-neutral-500" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          onClick={onResendTags}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md"
        >
          Update Records
        </Button>

        <Button
          onClick={onConfigureTag}
          className="w-full bg-purple-100 hover:bg-purple-100 text-purple-600 rounded-md"
        >
          Configure Settings
        </Button>
      </div>
    </div>
  );
}
