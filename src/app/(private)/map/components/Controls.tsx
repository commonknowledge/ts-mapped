import { ReactElement } from "react";
import { Separator } from "@/shadcn/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { AreaSetGroupCode } from "../sources";
import mapStyles, { MapStyle } from "../styles";
import { ControlsTabProps } from "./ControlsTab";

export class MapConfig {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = "WMC24";
  public excludeColumnsString = "";
  public markersDataSourceId = "";
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
  children,
}: {
  children: ReactElement<ControlsTabProps> | ReactElement<ControlsTabProps>[];
}) {
  const childArray = Array.isArray(children) ? children : [children];
  if (!childArray.length) {
    return null;
  }

  const tabs = childArray.map((child) => ({ label: child.props.label, child }));
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg gap-4 absolute top-0 left-0 m-3 p-4 z-10 w-[300px]">
      <Tabs defaultValue={tabs[0].label} className="w-full">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.label} value={tab.label}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Separator />
        {tabs.map((tab) => {
          return (
            <TabsContent
              key={tab.label}
              value={tab.label}
              className="flex flex-col gap-4 py-2"
            >
              {tab.child}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
