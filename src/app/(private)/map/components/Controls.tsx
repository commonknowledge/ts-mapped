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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { Label } from "@/shadcn/ui/label";
import { CornerDownRight, LandPlot, SquareStack } from "lucide-react";
import mapStyles, { mapColors } from "@/app/(private)/map/styles";
import { MapStyle } from "@/app/(private)/map/styles";
import { Toggle } from "@/shadcn/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";

import { SearchResult, DrawnPolygon } from "@/types";

import { MapRef } from "react-map-gl/mapbox";
import { MarkerData } from "@/types";
import MembersControl from "./control/MembersControl";
import MarkersControl from "./control/MarkersControl";
import TurfControl from "./control/TurfControl";

export class MapConfig {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = "WMC24";
  public excludeColumnsString = "";
  public markersDataSourceId = "634223d3-bc26-48bd-a3f2-58d2b9c62462";
  public mapStyle: MapStyle = mapStyles["light-v11"];
  public showLabels = true;
  public showBoundaryOutline = false;
  public showMembers = true;
  public showLocations = true;
  public showTurf = true;

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
  editingPolygon,
  setEditingPolygon,
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
  editingPolygon: DrawnPolygon | null;
  setEditingPolygon: (polygon: DrawnPolygon | null) => void;
}) {
  const dataSource = dataSources.find(
    (ds: { id: string }) => ds.id === mapConfig.areaDataSourceId
  );

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg gap-4 absolute top-0 left-0 m-3 p-4 z-10 w-[300px]">
      <Tabs defaultValue="layers">
        <div className="flex flex-row gap-2">
          <TabsList>
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="legend">Legend</TabsTrigger>
          </TabsList>
        </div>
        <Separator />

        <TabsContent value="layers" className="flex flex-col gap-4 py-2">
          <MembersControl
            members={members}
            mapRef={mapRef}
            isLoading={loading}
            showMembers={mapConfig.showMembers}
            setShowMembers={(value) => onChange({ showMembers: value })}
            mapConfig={mapConfig}
            onChange={onChange}
            dataSources={dataSources}
          />
          <Separator />
          <MarkersControl
            searchHistory={searchHistory}
            mapRef={mapRef}
            onEdit={onEditSearch}
            onDelete={onDeleteSearch}
            isLoading={loading}
            showLocations={mapConfig.showLocations}
            setShowLocations={(value) => onChange({ showLocations: value })}
          />
          <Separator />
          <TurfControl
            turfHistory={turfHistory}
            mapRef={mapRef}
            setTurfHistory={setTurfHistory}
            isLoading={loading}
            showTurf={mapConfig.showTurf}
            setShowTurf={(value) => onChange({ showTurf: value })}
            editingPolygon={editingPolygon}
            setEditingPolygon={setEditingPolygon}
          />
        </TabsContent>

        <TabsContent value="legend" className="flex flex-col gap-8 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="areaDataSourceId">
              <LandPlot className="w-4 h-4 text-muted-foreground" />
              Area Data Source
            </Label>
            <Select
              value={mapConfig.areaDataSourceId}
              onValueChange={(value) => onChange({ areaDataSourceId: value })}
            >
              <SelectTrigger className="w-full shadow-none">
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

            {dataSource ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <CornerDownRight className="ml-2 w-4 h-4 text-muted-foreground" />
                  <Select
                    value={mapConfig.areaDataColumn}
                    onValueChange={(value) =>
                      onChange({ areaDataColumn: value })
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
