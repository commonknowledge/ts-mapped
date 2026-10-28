"use client";

import { Check, FolderPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  useFolderMutations,
  useFoldersQuery,
} from "@/app/(private)/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import {
  useHandleDropPin,
  usePlacedMarkerMutations,
} from "@/app/(private)/map/[id]/hooks/usePlacedMarkers";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { useDataSources } from "@/hooks/useDataSources";
import { DataSourceRecordType } from "@/models/DataSource";
import { CollectionIcon } from "../components/Icons";

const sortDataSourcesByName = <T extends { name: string }>(dataSources: T[]) =>
  [...dataSources].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

/**
 * The Markers layer's "add" menu: single markers, member and marker
 * collections, and folders. Shared by the classic and light editor panels.
 */
export function useMarkerMenuItems() {
  const router = useRouter();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { data: folders = [] } = useFoldersQuery();
  const { isMutating: isPlacedMarkersMutating } = usePlacedMarkerMutations();
  const { insertFolder, isMutating: isFoldersMutating } = useFolderMutations();
  const { handleDropPin } = useHandleDropPin();
  const { data: dataSources } = useDataSources();

  const createFolder = () => {
    const newFolder = {
      id: uuidv4(),
      name: `New Folder ${folders.length + 1}`,
      notes: "",
      type: "placedMarker" as const,
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

  const getMemberDataSourceDropdownItems = () => {
    const memberDataSources = sortDataSourcesByName(
      dataSources?.filter((dataSource) => {
        return dataSource.recordType === DataSourceRecordType.Members;
      }) || [],
    );

    return memberDataSources.map((dataSource) => {
      const selected = dataSource.id === mapConfig.membersDataSourceId;
      return {
        type: "item" as const,
        icon: selected ? <Check /> : null,
        label: dataSource.name,
        onClick: () => {
          updateMapConfig({
            membersDataSourceId: selected ? null : dataSource.id,
          });
        },
      };
    });
  };

  const getMarkerDataSourceDropdownItems = () => {
    const markerDataSources = sortDataSourcesByName(
      dataSources?.filter((dataSource) => {
        return dataSource.recordType !== DataSourceRecordType.Members;
      }) || [],
    );

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
      label: "Add Member Collection",
      icon: <CollectionIcon color={mapColors.member.color} />,
      items: [
        ...getMemberDataSourceDropdownItems(),
        ...(getMemberDataSourceDropdownItems().length > 0
          ? [{ type: "separator" as const }]
          : []),
        {
          type: "item" as const,
          label: "Add new data source",
          onClick: () => router.push("/data-sources/new"),
        },
      ],
    },
    {
      type: "submenu" as const,
      label: "Add Marker Collection",
      icon: <CollectionIcon color={mapColors.markers.color} />,
      items: [
        ...getMarkerDataSourceDropdownItems(),
        ...(getMarkerDataSourceDropdownItems().length > 0
          ? [{ type: "separator" as const }]
          : []),
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

  const loading = isFoldersMutating || isPlacedMarkersMutating;

  return { getDropdownItems, loading };
}
