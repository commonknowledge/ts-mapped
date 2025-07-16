import { CornerDownRight, PaintBucketIcon, Scan } from "lucide-react";
import { useContext } from "react";
import { AreaSetGroupCode } from "@/__generated__/types";
import { ChoroplethContext } from "@/app/(private)/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { AREA_SET_GROUP_LABELS } from "../../sources";

export default function ChoroplethControl() {
  const { viewConfig, dataSourcesQuery, updateViewConfig } =
    useContext(MapContext);

  const { boundariesPanelOpen } = useContext(ChoroplethContext);

  const dataSources = dataSourcesQuery?.data?.dataSources || [];
  const dataSource = dataSources.find(
    (ds) => ds.id === viewConfig.areaDataSourceId,
  );

  if (!boundariesPanelOpen) return null;

  return (
    <div className="absolute z-50 bottom-26 left-1/2 -translate-x-1/2 flex flex-col gap-4 bg-white rounded-lg shadow-lg p-4 w-80 border border-neutral-200">
      {/* Boundary Outline Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
          <Scan className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Boundaries</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="areaSetGroupCode" className="text-sm font-medium">
            Select Boundary Data Source
          </Label>
          <Select
            value={viewConfig.areaSetGroupCode || NULL_UUID}
            onValueChange={(value) => {
              if (value === NULL_UUID) {
                updateViewConfig({
                  areaSetGroupCode: null,
                  showBoundaryOutline: false,
                });
              } else {
                updateViewConfig({
                  areaSetGroupCode: value as AreaSetGroupCode,
                  showBoundaryOutline: true,
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a boundary set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_UUID}>None</SelectItem>
              {Object.keys(AREA_SET_GROUP_LABELS).map((code) => (
                <SelectItem key={code} value={code}>
                  {AREA_SET_GROUP_LABELS[code as AreaSetGroupCode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Data Source Section */}
      <div className="space-y-3 bg-neutral-50 rounded-lg p-3 border border-neutral-200">
        <div className="flex items-center gap-2">
          <PaintBucketIcon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Shade Boundaries</h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label
              htmlFor="areaDataSourceId"
              className="text-sm text-neutral-600"
            >
              Data Source
            </Label>
            <Select
              value={viewConfig.areaDataSourceId}
              onValueChange={(value) => {
                updateViewConfig({ areaDataSourceId: value });
              }}
              disabled={!viewConfig.areaSetGroupCode}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NULL_UUID}>None</SelectItem>
                {dataSources.map((ds: { id: string; name: string }) => (
                  <SelectItem key={ds.id} value={ds.id}>
                    {ds.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div
            className={`space-y-2 transition-all duration-300 overflow-hidden ${
              viewConfig.areaDataSourceId === NULL_UUID
                ? "max-h-0 opacity-0"
                : "max-h-96 opacity-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <CornerDownRight className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-neutral-600">Data Column</Label>
            </div>

            <Select
              value={viewConfig.areaDataColumn}
              onValueChange={(value) =>
                updateViewConfig({ areaDataColumn: value })
              }
              disabled={!viewConfig.areaSetGroupCode}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MAX_COLUMN_KEY}>
                  Highest-value column
                </SelectItem>
                {dataSource?.columnDefs.map((cd: { name: string }) => (
                  <SelectItem key={cd.name} value={cd.name}>
                    {cd.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* Exclude Columns Input */}
      {viewConfig.areaDataColumn === MAX_COLUMN_KEY && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Exclude Columns</Label>
          <input
            type="text"
            onChange={(e) =>
              updateViewConfig({
                excludeColumnsString: e.target.value,
              })
            }
            placeholder="Comma-separated columns to exclude"
            value={viewConfig.excludeColumnsString}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}
