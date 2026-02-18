import { ArrowRight, PlusIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { LayerType } from "@/types";
import { useMapConfig } from "../../../hooks/useMapConfig";
import {
  useEditAreaMode,
  useSetEditAreaMode,
} from "../../../hooks/useMapControls";
import { useTurfsQuery } from "../../../hooks/useTurfsQuery";
import { useTurfState } from "../../../hooks/useTurfState";
import { mapColors } from "../../../styles";
import LayerControlWrapper from "../LayerControlWrapper";
import EmptyLayer from "../LayerEmptyMessage";
import LayerHeader from "../LayerHeader";
import TurfItem from "./TurfItem";

export default function AreasControl() {
  const { handleAddArea } = useTurfState();
  const editAreaMode = useEditAreaMode();
  const setEditAreaMode = useSetEditAreaMode();
  const [expanded, setExpanded] = useState(true);
  const { data: turfs = [] } = useTurfsQuery();
  const { mapConfig, updateMapConfig } = useMapConfig();

  const onAddArea = () => {
    if (editAreaMode) {
      setEditAreaMode(false);
    } else {
      setEditAreaMode(true);
      handleAddArea();
    }
  };

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Areas"
        type={LayerType.Turf}
        expanded={expanded}
        setExpanded={setExpanded}
        enableVisibilityToggle={Boolean(turfs?.length)}
      >
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <IconButtonWithTooltip tooltip="Area colour">
                  <SettingsIcon size={16} />
                </IconButtonWithTooltip>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-xs font-medium mb-2">Area colour</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded border border-neutral-300 flex-shrink-0 relative"
                  style={{
                    backgroundColor:
                      mapConfig.turfColor ?? mapColors.areas.color,
                  }}
                >
                  <input
                    type="color"
                    value={mapConfig.turfColor ?? mapColors.areas.color}
                    onChange={(e) =>
                      updateMapConfig({ turfColor: e.target.value })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Choose area colour"
                  />
                </div>
                <Input
                  type="text"
                  value={mapConfig.turfColor ?? mapColors.areas.color}
                  onChange={(e) =>
                    updateMapConfig({ turfColor: e.target.value })
                  }
                  className="flex-1 w-28"
                  placeholder={mapColors.areas.color}
                />
              </div>
              {mapConfig.turfColor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => updateMapConfig({ turfColor: undefined })}
                >
                  Reset to default
                </Button>
              )}
            </PopoverContent>
          </Popover>
          {!editAreaMode ? (
            <IconButtonWithTooltip
              tooltip="Add Area"
              onClick={() => onAddArea()}
            >
              <PlusIcon className="w-4 h-4" />
            </IconButtonWithTooltip>
          ) : (
            <div className="flex text-xs items-center text-muted-foreground gap-0.5">
              <span>Draw</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </LayerHeader>

      {expanded && (
        <div className="relative px-4 pb-6 pt-2">
          {turfs && turfs.length === 0 && (
            <EmptyLayer
              message="Add an Area Layer"
              onClick={onAddArea}
              showAsButton
            />
          )}
          <ul className="flex flex-col gap-1 ml-1">
            {turfs.map((turf) => (
              <li key={turf.id}>
                <TurfItem turf={turf} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </LayerControlWrapper>
  );
}
