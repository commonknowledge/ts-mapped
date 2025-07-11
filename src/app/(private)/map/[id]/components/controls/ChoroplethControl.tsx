import { CornerDownRight, LandPlot, SquareStack } from "lucide-react";
import { useContext } from "react";
import { AreaSetGroupCode } from "@/__generated__/types";
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
  const dataSources = dataSourcesQuery?.data?.dataSources || [];
  const dataSource = dataSources.find(
    (ds) => ds.id === viewConfig.areaDataSourceId,
  );
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="areaDataSourceId">
          <LandPlot className="w-4 h-4 text-muted-foreground" />
          Area Data Source
        </Label>
        <Select
          value={viewConfig.areaDataSourceId}
          onValueChange={(value) =>
            updateViewConfig({ areaDataSourceId: value })
          }
        >
          <SelectTrigger className="w-full shadow-none">
            <SelectValue placeholder="Select an area data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NULL_UUID}>None</SelectItem>
            {(dataSources || []).map((ds: { id: string; name: string }) => (
              <SelectItem key={ds.id} value={ds.id}>
                {ds.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {dataSource ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <CornerDownRight className="ml-2 w-4 h-4 text-muted-foreground" />
              <Select
                value={viewConfig.areaDataColumn}
                onValueChange={(value) =>
                  updateViewConfig({ areaDataColumn: value })
                }
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue placeholder="Select a data column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MAX_COLUMN_KEY}>
                    Highest-value column
                  </SelectItem>
                  {dataSource.columnDefs.map((cd: { name: string }) => (
                    <SelectItem key={cd.name} value={cd.name}>
                      {cd.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </div>
      {viewConfig.areaDataColumn === MAX_COLUMN_KEY && (
        <input
          type="text"
          onChange={(e) =>
            updateViewConfig({
              excludeColumnsString: e.target.value,
            })
          }
          placeholder="Comma-separated columns to exclude"
          value={viewConfig.excludeColumnsString}
        />
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="areaSetGroupCode">
          <SquareStack className="w-4 h-4 text-muted-foreground" />
          Boundary Set
        </Label>
        <Select
          value={viewConfig.areaSetGroupCode}
          onValueChange={(value) =>
            updateViewConfig({ areaSetGroupCode: value as AreaSetGroupCode })
          }
        >
          <SelectTrigger className="w-full shadow-none">
            <SelectValue placeholder="Select a boundary set" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(AREA_SET_GROUP_LABELS).map((code) => (
              <SelectItem key={code} value={code}>
                {AREA_SET_GROUP_LABELS[code as AreaSetGroupCode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
