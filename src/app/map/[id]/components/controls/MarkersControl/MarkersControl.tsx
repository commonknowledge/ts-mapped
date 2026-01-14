import {
  FolderPlusIcon,
  LoaderPinwheel,
  MapPin,
  PlusIcon,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  useDataSources,
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
} from "@/app/map/[id]/hooks/usePlacedMarkers";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { LayerType } from "@/types";
import { MarkerCollectionIcon, MarkerIndividualIcon } from "../../Icons";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import MarkersList from "./MarkersList";
import DataSourceSelectionModal from "./DataSourceSelectionModal";

export default function MarkersControl() {
  const router = useRouter();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { isMutating: isPlacedMarkersMutating } = usePlacedMarkerMutations();
  const { insertFolder, isMutating: isFoldersMutating } = useFolderMutations();
  const { handleDropPin } = useHandleDropPin();
  const { data: dataSources } = useDataSources();
  const [expanded, setExpanded] = useState(true);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);

  const createFolder = () => {
    const newFolder = {
      id: uuidv4(),
      name: `New Folder ${folders.length + 1}`,
      notes: "",
    };
    insertFolder(newFolder);
  };

  const handleManualSearch = () => {
    setTimeout(() => {
      const geocoderInput = document.querySelector(
        'mapbox-search-box [class$="--Input"]'
      ) as HTMLInputElement;
      if (geocoderInput) {
        geocoderInput.focus();
        geocoderInput.addEventListener(
          "blur",
          (e) => {
            e.preventDefault();
            geocoderInput.focus();
          },
          { once: true }
        );
      }
    }, 200);
  };

  const membersDataSource = useMembersDataSource();

  const handleSelectMemberDataSource = (dataSourceId: string | null) => {
    updateMapConfig({
      membersDataSourceId: dataSourceId,
    });
  };

  const handleSelectMarkerDataSource = (
    dataSourceId: string,
    isSelected: boolean
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
      >
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
        <div className="px-4 pb-3">
          <MarkersList />
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
