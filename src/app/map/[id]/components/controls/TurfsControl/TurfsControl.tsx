import {
  ArrowRight,
  FolderPlusIcon,
  LoaderPinwheel,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  useFolderMutations,
  useFoldersQuery,
} from "@/app/map/[id]/hooks/useFolders";
import ColorPalette from "@/components/ColorPalette";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Button } from "@/shadcn/ui/button";
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
import LayerHeader from "../LayerHeader";
import TurfsList from "./TurfsList";

export default function AreasControl() {
  const { handleAddArea } = useTurfState();
  const editAreaMode = useEditAreaMode();
  const setEditAreaMode = useSetEditAreaMode();
  const [expanded, setExpanded] = useState(true);
  const { data: turfs = [] } = useTurfsQuery();
  const { data: folders = [] } = useFoldersQuery();
  const { insertFolder, isMutating: isFoldersMutating } = useFolderMutations();
  const { mapConfig, updateMapConfig } = useMapConfig();

  const turfFolders = useMemo(() => {
    return folders.filter((f) => f.type === "turf");
  }, [folders]);

  const onAddArea = () => {
    if (editAreaMode) {
      setEditAreaMode(false);
    } else {
      setEditAreaMode(true);
      handleAddArea();
    }
  };

  const createFolder = () => {
    const newFolder = {
      id: uuidv4(),
      name: `New Folder ${turfFolders.length + 1}`,
      notes: "",
      type: "turf" as const,
      color: mapColors.areas.color,
    };
    insertFolder(newFolder);
  };

  const getDropdownItems = () => [
    {
      type: "item" as const,
      label: "Draw Area",
      onClick: () => onAddArea(),
    },
    { type: "separator" as const },
    {
      type: "item" as const,
      icon: <FolderPlusIcon className="w-4 h-4 text-muted-foreground" />,
      label: "Add Folder",
      onClick: () => createFolder(),
    },
  ];

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Areas"
        type={LayerType.Turf}
        expanded={expanded}
        setExpanded={setExpanded}
        enableVisibilityToggle={Boolean(turfs?.length || turfFolders.length)}
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
              <p className="text-xs font-medium px-2">Area colour</p>
              <ColorPalette
                selectedColor={mapConfig.turfColor ?? mapColors.areas.color}
                onColorSelect={(color) => updateMapConfig({ turfColor: color })}
              />
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
          {isFoldersMutating && (
            <LoaderPinwheel className="animate-spin" size={16} />
          )}
          {!editAreaMode ? (
            <IconButtonWithTooltip
              align="start"
              side="right"
              tooltip="Area options"
              dropdownLabel="Area options"
              dropdownItems={getDropdownItems()}
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
        <div className="px-4 pb-6">
          <TurfsList onAddArea={onAddArea} />
        </div>
      )}
    </LayerControlWrapper>
  );
}
