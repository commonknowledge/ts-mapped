import {
  AreaStatsQuery,
  DataSourcesQuery,
  MarkersQuery,
} from "@/__generated__/types";
import {
  AREA_SET_GROUP_LABELS,
  AreaSetGroupCode,
} from "@/app/(private)/map/sources";
import { MAX_COLUMN_KEY } from "@/constants";
import styles from "./Controls.module.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  CornerDownRight,
  LandPlot,
  MapPin,
  Paintbrush,
  Pin,
  SquareStack,
  Type,
} from "lucide-react";
import Legend from "./Legend";
import mapStyles, { mapColors } from "@/lib/mapStyles";
import { MapStyle } from "@/lib/mapStyles";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchHistory from "./SearchHistory";
import { useState } from "react";
import { DrawnPolygon, SearchResult } from "@/types";
import { MapRef } from "react-map-gl/mapbox";
import MemberList from "./MemberList";
import { MarkerData } from "@/types";
import TurfHistory from "./TurfHistory";

export class MapConfig {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = "WMC24";
  public excludeColumnsString = "";
  public markersDataSourceId = "634223d3-bc26-48bd-a3f2-58d2b9c62462";
  public mapStyle: MapStyle = mapStyles["light-v11"];
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

export default function Controls({
  dataSources,
  mapConfig,
  onChange,
  areaStatsData,
  searchHistory,
  mapRef,
  members,
  selectedMember,
  onSelectMember,
  onEditSearch,
  onDeleteSearch,
  turfHistory,
  setTurfHistory,
}: {
  dataSources: DataSourcesQuery["dataSources"];
  mapConfig: MapConfig;
  onChange: (mapConfig: Partial<MapConfig>) => void;
  areaStatsData: AreaStatsQuery["areaStats"] | undefined;
  searchHistory: SearchResult[];
  mapRef: React.RefObject<MapRef | null>;
  members: MarkersQuery["markers"] | undefined;
  selectedMember: MarkerData | null;
  onSelectMember: (member: MarkerData | null) => void;
  onEditSearch: (index: number, newText: string) => void;
  onDeleteSearch: (index: number) => void;
  turfHistory: DrawnPolygon[];
  setTurfHistory: React.Dispatch<React.SetStateAction<DrawnPolygon[]>>;
}) {
  const dataSource = dataSources.find(
    (ds: { id: string }) => ds.id === mapConfig.areaDataSourceId
  );

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg gap-4 absolute top-0 left-0 m-3 p-4 z-10 w-[300px]">
      <Tabs defaultValue="layers">
        <TabsList>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Separator />

        <TabsContent value="layers" className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2 items-center mb-2">
              <div
                style={{ backgroundColor: mapColors.member.color }}
                className="rounded-full w-3 h-3"
              />
              <Label>Members</Label>
            </div>
            <MemberList
              members={members}
              onSelect={(coordinates) => {
                const map = mapRef.current;
                if (map) {
                  map.flyTo({
                    center: coordinates,
                    zoom: 12,
                  });
                }
              }}
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2 items-center">
              <div
                style={{ backgroundColor: mapColors.searched.color }}
                className="rounded-full w-3 h-3"
              />
              <Label>Search History</Label>
            </div>
            <SearchHistory
              history={searchHistory}
              onSelect={(coordinates) => {
                const map = mapRef.current;
                if (map) {
                  map.flyTo({
                    center: coordinates,
                    zoom: 12,
                  });
                }
              }}
              onEdit={onEditSearch}
              onDelete={onDeleteSearch}
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2 items-center mb-2">
              <div
                style={{ backgroundColor: mapColors.turf.color }}
                className="rounded-full w-3 h-3"
              />
              <Label>Turf</Label>
            </div>
            <TurfHistory
              polygons={turfHistory}
              onSelect={(coordinates) => {
                const map = mapRef.current;
                if (map) {
                  map.flyTo({
                    center: coordinates,
                    zoom: 12,
                  });
                }
              }}
              onEdit={(index, newName) => {
                setTurfHistory((prev) =>
                  prev.map((poly, i) =>
                    i === index ? { ...poly, name: newName } : poly
                  )
                );
              }}
              onDelete={(index) => {
                setTurfHistory((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="settings" className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="markersDataSourceId">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Markers Data Source
            </Label>
            <Select
              value={mapConfig.markersDataSourceId}
              onValueChange={(value) =>
                onChange({ markersDataSourceId: value })
              }
            >
              <SelectTrigger className="w-full">
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
              onValueChange={(value) => onChange({ areaDataSourceId: value })}
            >
              <SelectTrigger className="w-full">
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
          {dataSource ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <CornerDownRight className="ml-2 w-4 h-4 text-muted-foreground" />
                <Select
                  value={mapConfig.areaDataColumn}
                  onValueChange={(value) => onChange({ areaDataColumn: value })}
                >
                  <SelectTrigger className="w-full">
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
              <Legend areaStats={areaStatsData} />
            </div>
          ) : null}
          {mapConfig.areaDataColumn === MAX_COLUMN_KEY ? (
            <input
              type="text"
              onChange={(e) =>
                onChange({
                  excludeColumnsString: e.target.value,
                })
              }
              placeholder="Comma-separated columns to exclude"
              value={mapConfig.excludeColumnsString}
            />
          ) : null}
          <Separator />
          <div className="flex flex-col gap-2">
            <Label htmlFor="areaSetGroupCode">
              <SquareStack className="w-4 h-4 text-muted-foreground" />
              Boundary Set
            </Label>
            <Select
              value={mapConfig.areaSetGroupCode}
              onValueChange={(value) =>
                onChange({ areaSetGroupCode: value as AreaSetGroupCode })
              }
            >
              <SelectTrigger className="w-full">
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
                  onChange({
                    mapStyle: mapStyles[value as keyof typeof mapStyles],
                  })
                }
              >
                <SelectTrigger className="w-full">
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
                onPressedChange={(value) => onChange({ showLabels: value })}
              >
                <Type className="w-4 h-4   text-muted-foreground" />
              </Toggle>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
