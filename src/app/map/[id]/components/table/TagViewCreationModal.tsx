"use client";

import { Filter, TagIcon } from "lucide-react";
import { useState } from "react";
import { getFilterDescription } from "@/app/map/[id]/utils/filterDescriptions";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import MarkerPreview from "../shared/MarkerPreview";
import type { DataSource } from "@/server/models/DataSource";
import type {
  DataSourceView,
  RecordFilterInput,
} from "@/server/models/MapView";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

interface DataRecord {
  id: string;
  name?: string;
  json?: {
    name?: string;
    Name?: string;
    title?: string;
    Title?: string;
    [key: string]: unknown;
  };
}

interface TagViewCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTagView: (label: string) => void;
  dataSource: DataSource;
  dataSourceView?: DataSourceView;
  defaultLabel: string;
  placedMarkers?: PlacedMarker[];
  dataRecords?: DataRecord[];
}

export default function TagViewCreationModal({
  isOpen,
  onClose,
  onCreateTagView,
  dataSource,
  dataSourceView,
  defaultLabel,
  placedMarkers = [],
  dataRecords = [],
}: TagViewCreationModalProps) {
  const [tagLabel, setTagLabel] = useState(defaultLabel);

  // Debug logging
  console.log("TagViewCreationModal Debug:", {
    dataRecordsCount: dataRecords.length,
    dataRecords: dataRecords,
    dataSourceViewFilter: dataSourceView?.filter,
  });

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

  const renderFilterDescription = (filter: RecordFilterInput) => {
    // For placed marker filters, use MarkerPreview component
    if (filter.placedMarker) {
      const distance = filter.distance;
      return (
        <span className="flex items-center gap-1">
          {distance ? `${distance}km from ` : "Near "}
          <MarkerPreview
            markerId={filter.placedMarker}
            placedMarkers={placedMarkers}
            showIcon={false}
          />
        </span>
      );
    }

    // For other filters, use the standard description
    return getFilterDescription(filter, placedMarkers, dataRecords);
  };

  const handleCreate = () => {
    onCreateTagView(tagLabel);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-lg shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-8 h-8 bg-purple-600 rounded-sm flex items-center justify-center text-white">
              <TagIcon className="w-5 h-5" />
            </div>
            Send tags to {dataSource.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Explainer Text */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">
              How Tagging Works
            </h3>
            <p className="text-sm text-purple-800 leading-relaxed mb-3">
              Segment your data by tagging records based on mapped data. This
              will:
            </p>
            <ul className="text-sm text-purple-800 space-y-1 ml-4">
              <li>
                • Create a new column in your datasource with the name of your
                tag label below
              </li>
              <li>
                • Mark any record that meets the segmentation settings as
                &quot;true&quot; so you can make the same segmentation with-in
                your CRM/tool.
              </li>
              <li>
                • Click resend to update the tags if you update the segmentation
                settings or have new data in your data source.
              </li>
            </ul>
          </div>

          {/* Data Source */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Data Source</h3>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
              <DataSourceIcon type={dataSource.config?.type as string} />
              <span className="text-sm text-gray-900">{dataSource.name}</span>
            </div>
          </div>

          {/* Segmentation Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              Targeting Records based on:
            </h3>
            {hasFilters ? (
              <div className="flex flex-wrap gap-2">
                {/* Show children filters if they exist */}
                {dataSourceView?.filter.children?.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 border-gray-300 hover:bg-gray-100"
                  >
                    {renderFilterDescription(filter)}
                  </Badge>
                ))}
                {/* Show direct filter if no children but has filter criteria */}
                {(!dataSourceView?.filter.children ||
                  dataSourceView.filter.children.length === 0) && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 border-gray-300 hover:bg-gray-100"
                  >
                    {renderFilterDescription(dataSourceView?.filter)}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex gap-2 items-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                <Filter className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-500">
                  No filters configured. Add filters in the table section to
                  enable tagging.
                </p>
              </div>
            )}
          </div>

          {/* Tag Label Input */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Tag Label</h3>
            <p className="text-xs text-gray-500">
              This label will be used as the column name in your data source and
              cannot be changed after creation.
            </p>
            <Input
              value={tagLabel}
              onChange={(e) => setTagLabel(e.target.value)}
              placeholder="Enter tag label..."
              className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!tagLabel.trim() || !hasFilters}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next{" "}
            </Button>
          </div>
          {!hasFilters && (
            <p className="text-xs text-gray-500 text-center">
              Add filters to enable tagging
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
