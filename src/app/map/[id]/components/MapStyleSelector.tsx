import { Layers, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { MapTypeLabels } from "@/labels";
import { type MapStyleName, MapType, mapTypes } from "@/server/models/MapView";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import mapStyles from "../styles";

export default function MapStyleSelector() {
  const [open, setOpen] = useState(false);
  const { viewConfig, updateViewConfig } = useMapViews();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-12 h-12 flex items-center justify-center rounded-xl shadow-sm bg-white hover:bg-muted text-primary cursor-pointer">
        <Layers size={20} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 shadow-sm">
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

            <div className="border-b p-3">
              <div className="flex gap-2">
                {mapTypes.map((type) => {
                  const isDefault = !viewConfig.mapType && type === MapType.Geo;
                  const isChecked = viewConfig.mapType === type || isDefault;

                  return (
                    <div
                      key={type}
                      className={cn(
                        "flex flex-col items-center flex-grow-1 shadow-sm rounded-md p-3",
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
                        className="flex flex-col gap-1 / text-center text-xs text-muted-foreground / cursor-pointer"
                      >
                        <div className={cn("w-[56px] h-[56px]")}>
                          {/* {thumbnail && <Image src={thumbnail} alt="" />} */}
                        </div>
                        {MapTypeLabels[type]}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <legend className="sr-only">Select map style:</legend>

            <div className="flex gap-2 p-3 border-b">
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
          </fieldset>

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
        </form>
      </PopoverContent>
    </Popover>
  );
}
