import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { HexagonIcon, Layers, MapIcon, X } from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { NULL_UUID } from "@/constants";
import { AreaSetCodeLabels, AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetCode, AreaSetGroupCode } from "@/server/models/AreaSet";
import { type MapStyleName, MapType, mapTypes } from "@/server/models/MapView";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";
import { Tooltip, TooltipContent } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { useChoroplethDataSource } from "../hooks/useDataSources";
import mapStyles from "../styles";
import { getValidAreaSetGroupCodes } from "./Choropleth/areas";

export default memo(function MapStyleSelector() {
  const [open, setOpen] = useState(false);
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const validAreaSetGroups = getValidAreaSetGroupCodes(
    dataSource?.geocodingConfig,
  );
  const { setBoundariesPanelOpen } = useChoropleth();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-12 h-12 flex items-center justify-center rounded-xl shadow-sm bg-white hover:bg-muted text-primary cursor-pointer">
        <Layers size={20} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 shadow-sm min-w-[272px]">
        <div className="flex justify-between items-center gap-8 p-3 border-b">
          <h2 className="font-semibold text-sm">Map Layers</h2>
          <button
            aria-label="Close style selector popover"
            className="text-muted-foreground hover:text-primary cursor-pointer"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <form className="flex flex-col">
          <fieldset>
            <legend className="sr-only">Select map type:</legend>

            <div className="border-b p-3 flex flex-col gap-1">
              <span className="text-muted-foreground font-mono uppercase text-sm">
                Layout
              </span>
              <div className="flex gap-2">
                {mapTypes.map((type) => {
                  const isDefault = !viewConfig.mapType && type === MapType.Geo;
                  const isChecked = viewConfig.mapType === type || isDefault;

                  return (
                    <div
                      key={type}
                      className={cn(
                        "flex flex-col flex-grow-1 basis-0 shadow-xs rounded-md",
                        "border-2 hover:border-blue-300",
                        {
                          "border-blue-300": isChecked,
                        },
                      )}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="mapStyle"
                        id={type}
                        value={type}
                        checked={isChecked}
                        onChange={() =>
                          updateViewConfig({
                            mapType: type,
                          })
                        }
                      />
                      <label
                        htmlFor={type}
                        className={cn(
                          "p-3 flex flex-col gap-2 items-center / text-center text-xs / cursor-pointer",
                          { "text-muted-foreground": !isChecked },
                        )}
                      >
                        {type === MapType.Hex ? (
                          <HexagonIcon className="w-6 h-6" />
                        ) : (
                          <MapIcon className="w-6 h-6" />
                        )}
                        {type === MapType.Hex ? "Hex map" : "Geographic"}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewConfig.mapType !== MapType.Hex && (
              <>
                <div className="flex flex-col gap-1 p-3 border-b">
                  <span className="text-muted-foreground font-mono uppercase text-sm">
                    Base map
                  </span>

                  <legend className="sr-only">Select map style:</legend>

                  <div className="flex gap-2">
                    {Object.keys(mapStyles).map((code) => {
                      const styleName =
                        mapStyles[code as keyof typeof mapStyles].name;
                      const thumbnail =
                        mapStyles[code as keyof typeof mapStyles].thumbnail;
                      const isChecked = viewConfig.mapStyleName === styleName;

                      return (
                        <div key={styleName}>
                          <input
                            className="sr-only"
                            type="radio"
                            name="mapStyle"
                            id={styleName}
                            value={styleName}
                            checked={isChecked}
                            onChange={() =>
                              updateViewConfig({
                                mapStyleName: styleName as MapStyleName,
                              })
                            }
                          />
                          <label
                            htmlFor={styleName}
                            className={cn(
                              "flex flex-col gap-1 / text-center text-xs text-muted-foreground / cursor-pointer",
                              { "text-muted-foreground": !isChecked },
                            )}
                          >
                            <div
                              className={cn(
                                "w-[56px] h-[56px] rounded-lg overflow-hidden bg-muted",
                                "border-2 border-transparent hover:border-blue-300",
                                {
                                  "border-blue-300": isChecked,
                                },
                              )}
                            >
                              {thumbnail && <Image src={thumbnail} alt="" />}
                            </div>
                            {styleName}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 border-b">
                  <span className="text-muted-foreground font-mono uppercase text-sm">
                    Boundaries
                  </span>
                  <Select
                    value={viewConfig.areaSetGroupCode || NULL_UUID}
                    onValueChange={(value) => {
                      if (
                        value === NULL_UUID ||
                        validAreaSetGroups.includes(value)
                      ) {
                        updateViewConfig({
                          areaSetGroupCode:
                            value === NULL_UUID
                              ? null
                              : (value as AreaSetGroupCode),
                        });
                        return;
                      }
                      setOpen(false);
                      setBoundariesPanelOpen(true);
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Choose boundaries..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NULL_UUID}>No locality</SelectItem>
                      {Object.values(AreaSetGroupCode).map((code) =>
                        validAreaSetGroups.includes(code) ? (
                          <SelectItem key={code} value={code}>
                            {AreaSetGroupCodeLabels[code]}
                          </SelectItem>
                        ) : (
                          <Tooltip key={code}>
                            <TooltipTrigger asChild>
                              <SelectItem
                                className="text-muted-foreground hover:text-muted-foreground focus:text-muted-foreground"
                                value={code}
                              >
                                {AreaSetGroupCodeLabels[code]}
                              </SelectItem>
                            </TooltipTrigger>
                            <TooltipContent>
                              Not available with the current data visualisation
                            </TooltipContent>
                          </Tooltip>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 p-3 border-b">
                  <span className="text-muted-foreground font-mono uppercase text-sm">
                    Secondary boundaries
                  </span>
                  <Select
                    value={viewConfig.secondaryAreaSetCode || NULL_UUID}
                    onValueChange={(value) => {
                      updateViewConfig({
                        secondaryAreaSetCode:
                          value === NULL_UUID ? null : (value as AreaSetCode),
                      });
                    }}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Choose secondary boundaries..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NULL_UUID}>No locality</SelectItem>
                      {Object.values(AreaSetCode).map((code) => (
                        <SelectItem key={code} value={code}>
                          {AreaSetCodeLabels[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </fieldset>

          {viewConfig.mapType !== MapType.Hex && (
            <div className="p-3">
              <FormFieldWrapper label="Show labels" isHorizontal>
                <Switch
                  checked={viewConfig.showLabels}
                  onCheckedChange={(checked) =>
                    updateViewConfig({ showLabels: checked })
                  }
                />
              </FormFieldWrapper>
            </div>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
});
