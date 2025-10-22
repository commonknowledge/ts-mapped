import { Check, Ellipsis, FolderPlusIcon, LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { mapColors } from "@/app/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { CollectionIcon } from "../../../Icons";
import ControlItemWrapper from "../../ControlItemWrapper";
import LayerHeader from "../../LayerHeader";
import MarkersList from "./MarkersList";

export default function MarkersControl() {
  const router = useRouter();
  const { viewConfig, updateViewConfig } = useMapViews();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { isFetching: placedMarkersLoading } = usePlacedMarkersQuery();
  const { folders, foldersLoading, insertFolder, handleDropPin } =
    useContext(MarkerAndTurfContext);
  const { data: dataSources } = useDataSources();
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
    <ControlItemWrapper className="markers-control">
      <LayerHeader
        label="Markers"
        color={mapColors.markers.color}
        showLayer={viewConfig.showLocations}
        setLayer={(show) => updateViewConfig({ showLocations: show })}
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
          <Ellipsis className="w-4 h-4" />
        </IconButtonWithTooltip>
      </LayerHeader>
      {expanded && <MarkersList />}
    </ControlItemWrapper>
  );
}
