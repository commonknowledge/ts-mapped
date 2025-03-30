import {
  CornerDownRight,
  LandPlot,
  MapPin,
  Paintbrush,
  SquareStack,
  Type,
} from "lucide-react";
import { ReactElement } from "react";
import { DataSourcesQuery } from "@/__generated__/types";
import { MAX_COLUMN_KEY } from "@/constants";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { Toggle } from "@/shadcn/ui/toggle";
import { AREA_SET_GROUP_LABELS, AreaSetGroupCode } from "../sources";
import mapStyles, { MapStyle } from "../styles";
import Legend from "./Legend";

export class MapConfig {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = "WMC24";
  public excludeColumnsString = "";
  public markersDataSourceId = "";
  public mapStyle: MapStyle = mapStyles["dark-v11"];
  public showLabels = true;

  constructor(params: Partial<MapConfig> = {}) {
    Object.assign(this, params);
  }

  getExcludeColumns() {
    return this.excludeColumnsString
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
}

export default function Settings({
  dataSources,
  mapConfig,
  onChangeConfig,
  children,
}: {
  dataSources: DataSourcesQuery["dataSources"];
  mapConfig: MapConfig;
  onChangeConfig: (mc: Partial<MapConfig>) => void;
  children: ReactElement<typeof Legend>;
}) {
  const areaDataSource = dataSources.find(
    (ds: { id: string }) => ds.id === mapConfig.areaDataSourceId,
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="markersDataSourceId">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Markers Data Source
        </Label>
        <Select
          value={mapConfig.markersDataSourceId}
          onValueChange={(value) =>
            onChangeConfig({ markersDataSourceId: value })
          }
        >
          <SelectTrigger className="w-full" id="markersDataSourceId">
            <SelectValue placeholder="Select a markers data source" />
          </SelectTrigger>
          <SelectContent>
            {dataSources.map((ds: { id: string; name: string }) => (
              <SelectItem key={ds.id} value={ds.id}>
                {ds.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="areaDataSourceId">
          <LandPlot className="w-4 h-4 text-muted-foreground" />
          Area Data Source
        </Label>
        <Select
          value={mapConfig.areaDataSourceId}
          onValueChange={(value) => onChangeConfig({ areaDataSourceId: value })}
        >
          <SelectTrigger className="w-full" id="areaDataSourceId">
            <SelectValue placeholder="Select an area data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Null">None</SelectItem>
            {dataSources.map((ds: { id: string; name: string }) => (
              <SelectItem key={ds.id} value={ds.id}>
                {ds.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {areaDataSource && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            <CornerDownRight className="ml-2 w-4 h-4 text-muted-foreground" />
            <Select
              value={mapConfig.areaDataColumn}
              onValueChange={(value) =>
                onChangeConfig({ areaDataColumn: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a data column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MAX_COLUMN_KEY}>
                  Highest-value column
                </SelectItem>
                {areaDataSource.columnDefs.map((cd: { name: string }) => (
                  <SelectItem key={cd.name} value={cd.name}>
                    {cd.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {children}
        </div>
      )}
      {mapConfig.areaDataColumn === MAX_COLUMN_KEY && (
        <input
          type="text"
          onChange={(e) =>
            onChangeConfig({
              excludeColumnsString: e.target.value,
            })
          }
          placeholder="Comma-separated columns to exclude"
          value={mapConfig.excludeColumnsString}
        />
      )}
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="areaSetGroupCode">
          <SquareStack className="w-4 h-4 text-muted-foreground" />
          Boundary Set
        </Label>
        <Select
          value={mapConfig.areaSetGroupCode}
          onValueChange={(value) =>
            onChangeConfig({ areaSetGroupCode: value as AreaSetGroupCode })
          }
        >
          <SelectTrigger className="w-full" id="areaSetGroupCode">
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
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="mapStyle">
          <Paintbrush className="w-4 h-4 text-muted-foreground" />
          Map Style
        </Label>
        <div className="flex flex-row gap-2">
          <Select
            value={mapConfig.mapStyle.slug}
            onValueChange={(value) =>
              onChangeConfig({
                mapStyle: mapStyles[value as keyof typeof mapStyles],
              })
            }
          >
            <SelectTrigger className="w-full" id="mapStyle">
              <SelectValue placeholder="Select a map style" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(mapStyles).map((code) => (
                <SelectItem
                  key={code}
                  value={mapStyles[code as keyof typeof mapStyles].slug}
                >
                  {mapStyles[code as keyof typeof mapStyles].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Toggle
            pressed={mapConfig.showLabels}
            onPressedChange={(value) => onChangeConfig({ showLabels: value })}
          >
            <Type className="w-4 h-4 text-muted-foreground" />
          </Toggle>
        </div>
      </div>
    </>
  );
}
