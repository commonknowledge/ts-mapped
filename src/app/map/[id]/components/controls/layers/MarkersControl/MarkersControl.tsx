import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlusIcon,
  LoaderPinwheel,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { mapColors } from "@/app/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { CollectionIcon } from "../../../Icons";
import { defaultLayerStyles } from "../../LayerStyles";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const router = useRouter();
  const { viewConfig } = useMapViews();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { data: dataSources } = useDataSources();
  const {
    placedMarkersLoading,
    folders,
    foldersLoading,
    insertFolder,
    handleDropPin,
  } = useContext(MarkerAndTurfContext);
  const [expanded, setExpanded] = useState(true);

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
        'mapbox-search-box [class$="--Input"]',
      ) as HTMLInputElement;
      if (geocoderInput) {
        geocoderInput.focus();
        geocoderInput.addEventListener(
          "blur",
          (e) => {
            e.preventDefault();
            geocoderInput.focus();
          },
          { once: true },
        );
      }
    }, 200);
  };

  const getDataSourceDropdownItems = () => {
    const markerDataSources =
      dataSources?.filter((dataSource) => {
        return dataSource.recordType !== DataSourceRecordType.Members;
      }) || [];

    return markerDataSources.map((dataSource) => {
      const selected = mapConfig.markerDataSourceIds.includes(dataSource.id);
      return {
        type: "item" as const,
        icon: selected ? <Check /> : null,
        label: dataSource.name,
        onClick: () => {
          updateMapConfig({
            markerDataSourceIds: selected
              ? mapConfig.markerDataSourceIds.filter(
                (id) => id !== dataSource.id,
              )
              : [...mapConfig.markerDataSourceIds, dataSource.id],
          });
        },
      };
    });
  };

  const getDropdownItems = () => [
    {
      type: "submenu" as const,
      label: "Add Single Marker",
      icon: (
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: mapColors.markers.color }}
        />
      ),
      items: [
        {
          type: "item" as const,
          label: "Search for a location",
          onClick: () => handleManualSearch(),
        },
        {
          type: "item" as const,
          label: "Drop a pin on the map",
          onClick: () => handleDropPin(),
        },
      ],
    },
    {
      type: "submenu" as const,
      label: "Add Marker Collection",
      icon: <CollectionIcon color={mapColors.markers.color} />,
      items: [
        ...getDataSourceDropdownItems(),
        {
          type: "separator" as const,
        },
        {
          type: "item" as const,
          label: "Add new data source",
          onClick: () => router.push("/data-sources/new"),
        },
      ],
    },
    { type: "separator" as const },
    {
      type: "item" as const,
      icon: <FolderPlusIcon className="w-4 h-4 text-muted-foreground" />,
      label: "Add Folder",
      onClick: () => createFolder(),
    },
  ];

  const loading = foldersLoading || placedMarkersLoading;

  return (
    <div className={defaultLayerStyles.container}>
      {/* Header */}
      <div className={defaultLayerStyles.header}>
        <button
          className="flex items-center gap-2 hover:bg-neutral-100 rounded p-1 -m-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          )}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: mapColors.markers.color }}
          />
          <span className="text-sm font-medium">Markers</span>
        </button>
        <div className="flex items-center gap-1">
          {loading && <LoaderPinwheel className="animate-spin w-4 h-4" />}
          <IconButtonWithTooltip
            align="start"
            side="right"
            tooltip="Add markers"
            dropdownLabel="Marker options"
            dropdownItems={getDropdownItems()}
          >
            <Plus className="w-4 h-4" />
          </IconButtonWithTooltip>
        </div>
      </div>

      {/* Layer Items */}
      {expanded && (
        <div
          className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"}`}
        >
          <MarkersList />
        </div>
      )}
    </div>
  );
}
