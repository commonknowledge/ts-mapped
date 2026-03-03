import {
  FolderPlusIcon,
  LoaderPinwheel,
  PlusIcon,
  Search,
  SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  useDataSources,
  useMarkerDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import {
  useFolderMutations,
  useFoldersQuery,
} from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import {
  useHandleDropPin,
  usePlacedMarkerMutations,
  usePlacedMarkersQuery,
} from "@/app/map/[id]/hooks/usePlacedMarkers";
import ColorPalette from "@/components/ColorPalette";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { LayerType } from "@/types";
import { mapColors } from "../../../styles";
import { MarkerCollectionIcon, MarkerIndividualIcon } from "../../Icons";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import DataSourceSelectionModal from "./DataSourceSelectionModal";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { isMutating: isPlacedMarkersMutating } = usePlacedMarkerMutations();
  const { insertFolder, isMutating: isFoldersMutating } = useFolderMutations();
  const { handleDropPin } = useHandleDropPin();
  const { data: dataSources } = useDataSources();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const markerDataSources = useMarkerDataSources() || [];
  const membersDataSource = useMembersDataSource();
  const [expanded, setExpanded] = useState(true);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);

  const createFolder = () => {
    const newFolder = {
      id: uuidv4(),
      name: `New Folder ${folders.length + 1}`,
      notes: "",
      type: "placedMarker" as const,
      color: mapColors.markers.color,
    };
    insertFolder(newFolder);
  };

  const handleManualSearch = () => {
    setTimeout(() => {
      const searchButton = document.querySelector(
        "#search-box button",
      ) as HTMLButtonElement | null;
      if (searchButton) {
        searchButton.click();
      }
    }, 200);
  };

  const handleSelectMemberDataSource = (dataSourceId: string | null) => {
    updateMapConfig({
      membersDataSourceId: dataSourceId,
    });
  };

  const handleSelectMarkerDataSource = (
    dataSourceId: string,
    isSelected: boolean,
  ) => {
    updateMapConfig({
      markerDataSourceIds: isSelected
        ? mapConfig.markerDataSourceIds.filter((id) => id !== dataSourceId)
        : [...mapConfig.markerDataSourceIds, dataSourceId],
    });
  };

  const getDropdownItems = () => [
    {
      type: "submenu" as const,
      label: "Add Single Marker",
      icon: <MarkerIndividualIcon color="#6b7280" />,
      items: [
        {
          type: "item" as const,
          label: "Search for a location",
          icon: <Search className="w-4 h-4 text-neutral-600" />,
          onClick: () => handleManualSearch(),
        },
        {
          type: "item" as const,
          label: "Drop a pin on the map",
          icon: <MarkerIndividualIcon color="#6b7280" />,
          onClick: () => handleDropPin(),
        },
      ],
    },
    {
      type: "item" as const,
      label: "Markers from data sources",
      icon: <MarkerCollectionIcon color="#6b7280" />,
      onClick: () => setIsDataSourceModalOpen(true),
    },
    { type: "separator" as const },
    {
      type: "item" as const,
      icon: <FolderPlusIcon className="w-4 h-4 text-neutral-600" />,
      label: "Add Folder",
      onClick: () => createFolder(),
    },
  ];

  const loading = isFoldersMutating || isPlacedMarkersMutating;

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Markers"
        type={LayerType.Marker}
        expanded={expanded}
        setExpanded={setExpanded}
        enableVisibilityToggle={Boolean(
          placedMarkers.length > 0 ||
          markerDataSources.length > 0 ||
          membersDataSource,
        )}
      >
        <Popover>
          <PopoverTrigger asChild>
            <div>
              <IconButtonWithTooltip tooltip="Marker colour">
                <SettingsIcon size={16} />
              </IconButtonWithTooltip>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs font-medium px-2">Marker colour</p>
            <ColorPalette
              selectedColor={
                mapConfig.placedMarkerColor ?? mapColors.markers.color
              }
              onColorSelect={(color) =>
                updateMapConfig({ placedMarkerColor: color })
              }
            />
            {mapConfig.placedMarkerColor && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() =>
                  updateMapConfig({ placedMarkerColor: undefined })
                }
              >
                Reset to default
              </Button>
            )}
          </PopoverContent>
        </Popover>
        {loading && <LoaderPinwheel className="animate-spin" size={16} />}
        <IconButtonWithTooltip
          align="start"
          side="right"
          tooltip="Marker options"
          dropdownLabel="Marker options"
          dropdownItems={getDropdownItems()}
        >
          <PlusIcon size={16} />
        </IconButtonWithTooltip>
      </LayerHeader>
      {expanded && (
        <div className="px-4 pb-6">
          <MarkersList dropdownItems={getDropdownItems()} />
        </div>
      )}

      <DataSourceSelectionModal
        open={isDataSourceModalOpen}
        onOpenChange={setIsDataSourceModalOpen}
        dataSources={dataSources || []}
        selectedMemberDataSourceId={mapConfig.membersDataSourceId || null}
        selectedMarkerDataSourceIds={mapConfig.markerDataSourceIds}
        onSelectMemberDataSource={handleSelectMemberDataSource}
        onSelectMarkerDataSource={handleSelectMarkerDataSource}
      />
    </LayerControlWrapper>
  );
}
