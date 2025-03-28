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
} from "@/shadcn/components/ui/select";
import { Separator } from "@/shadcn/components/ui/separator";
import { Label } from "@/shadcn/components/ui/label";
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
import mapStyles, { mapColors } from "@/app/(private)/map/styles";
import { MapStyle } from "@/app/(private)/map/styles";
import { Toggle } from "@/shadcn/components/ui/toggle";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import SearchHistory from "./dataLists/SearchHistory";
import { useState } from "react";
import { DrawnPolygon, SearchResult } from "@/types";
import { MapRef } from "react-map-gl/mapbox";
import MemberList from "./dataLists/MemberList";
import { MarkerData } from "@/types";
import TurfHistory from "./dataLists/TurfHistory";
import MembersControl from "./control/MembersControl";
import LocationsControl from "./control/LocationsControl";
import TurfControl from "./control/TurfControl";

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
  loading,
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
  loading?: boolean;
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
          <MembersControl
            members={members}
            mapRef={mapRef}
            isLoading={loading}
          />
          <Separator />
          <LocationsControl
            searchHistory={searchHistory}
            mapRef={mapRef}
            onEdit={onEditSearch}
            onDelete={onDeleteSearch}
            isLoading={loading}
          />
          <Separator />
          <TurfControl
            turfHistory={turfHistory}
            mapRef={mapRef}
            setTurfHistory={setTurfHistory}
            isLoading={loading}
          />
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
