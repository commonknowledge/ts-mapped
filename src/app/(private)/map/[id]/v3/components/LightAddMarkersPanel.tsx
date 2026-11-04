"use client";

import {
  FolderPlusIcon,
  MapPinPlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import DataSourceIcon from "@/components/DataSourceIcon";
import { DataSourceRecordType } from "@/models/DataSource";
import { Separator } from "@/shadcn/ui/separator";
import RingSwatch from "../../components/RingSwatch";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useDropCustomMarker } from "../../hooks/useDropCustomMarker";
import { useFolderMutations, useFoldersQuery } from "../../hooks/useFolders";
import { useMapConfig } from "../../hooks/useMapConfig";
import { useShowControls } from "../../hooks/useMapControls";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { CONTROL_PANEL_WIDTH, VISUALISATION_PANEL_WIDTH } from "../../styles";
import { useAddMarkersPanel } from "../hooks/useAddMarkersPanel";
import { useTourFocusedDataSourceId } from "../hooks/useTour";
import LightDataSourceList from "./LightDataSourceList";
import type { ListedDataSource } from "./LightDataSourceList";
import type { ReactNode } from "react";

// The search box is a Mapbox web component; focus its input directly
const focusPlaceSearch = () => {
  const input = document.querySelector<HTMLInputElement>(
    'mapbox-search-box [class$="--Input"]',
  );
  input?.focus();
};

// Everything you can put on the map as points: a custom marker, a place, a
// folder, or a whole collection from a data source. Sits where the
// visualisation flyout does, and only one of them is open at a time.
export default function LightAddMarkersPanel() {
  const [isOpen, setIsOpen] = useAddMarkersPanel();
  const showControls = useShowControls();
  const { boundariesPanelOpen } = useChoropleth();
  const { markerSettingsDataSourceId } = useMarkerSettings();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const tourFocusedId = useTourFocusedDataSourceId("markers");
  const { data: folders = [] } = useFoldersQuery();
  const { insertFolder } = useFolderMutations();
  const dropCustomMarker = useDropCustomMarker();

  // Another flyout opening takes this panel's place
  useEffect(() => {
    if (boundariesPanelOpen || markerSettingsDataSourceId) {
      setIsOpen(false);
    }
  }, [boundariesPanelOpen, markerSettingsDataSourceId, setIsOpen]);

  if (!isOpen) return null;

  const isOnMap = (ds: ListedDataSource) =>
    mapConfig.membersDataSourceId === ds.id ||
    mapConfig.markerDataSourceIds.includes(ds.id);

  // Members sources are the map's member collection; anything else is an
  // additional marker collection
  const toggleCollection = (ds: ListedDataSource) => {
    if (ds.recordType === DataSourceRecordType.Members) {
      updateMapConfig({
        membersDataSourceId:
          mapConfig.membersDataSourceId === ds.id ? null : ds.id,
      });
      return;
    }
    const ids = mapConfig.markerDataSourceIds;
    updateMapConfig({
      markerDataSourceIds: ids.includes(ds.id)
        ? ids.filter((id) => id !== ds.id)
        : [...ids, ds.id],
    });
  };

  const markerFolderCount = folders.filter(
    (f) => !f.type || f.type === "placedMarker",
  ).length;

  return (
    <div
      data-tour="add-markers"
      // A flyout beside the Layers panel: the guided tour keeps clear of it
      data-tour-flyout
      className="absolute top-0 z-100 flex h-full flex-col gap-4 overflow-y-auto border-r border-neutral-200 bg-neutral-50 p-3"
      style={{
        left: showControls ? CONTROL_PANEL_WIDTH : 0,
        width: VISUALISATION_PANEL_WIDTH,
        minWidth: VISUALISATION_PANEL_WIDTH,
      }}
      aria-label="Add markers"
    >
      <div className="flex items-start justify-between gap-6 text-sm">
        <h3 className="mt-2 font-medium">Add markers</h3>
        <button
          type="button"
          aria-label="Close add markers panel"
          className="cursor-pointer text-muted-foreground hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          <XIcon size={20} />
        </button>
      </div>

      <Separator />

      <ul className="-mx-1.5 flex flex-col">
        <PanelAction
          icon={<MapPinPlusIcon className="size-4" />}
          title="Drop a custom marker"
          tourId="drop-marker"
          description="Click the map to place it. It's saved in Custom markers."
          onClick={() => {
            setIsOpen(false);
            dropCustomMarker();
          }}
        />
        <PanelAction
          icon={<SearchIcon className="size-4" />}
          title="Search for a place"
          description="Find an address or postcode and pin it."
          onClick={() => {
            setIsOpen(false);
            focusPlaceSearch();
          }}
        />
        <PanelAction
          icon={<FolderPlusIcon className="size-4" />}
          title="New folder"
          description="Group custom markers however you like."
          onClick={() =>
            insertFolder({
              id: uuidv4(),
              name: `New Folder ${markerFolderCount + 1}`,
              notes: "",
              type: "placedMarker",
            })
          }
        />
      </ul>

      <div>
        <p className="mb-2 text-sm font-medium">Collections</p>
        <LightDataSourceList
          onSelect={toggleCollection}
          isSelected={isOnMap}
          focusedId={tourFocusedId}
          renderMarker={(ds) => <CollectionMarker dataSource={ds} />}
        />
      </div>
    </div>
  );
}

function PanelAction({
  icon,
  title,
  description,
  onClick,
  tourId,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  /** Pointed at by the guided tour */
  tourId?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        data-tour={tourId}
        className="flex w-full cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-2 text-left hover:bg-neutral-100"
      >
        <span className="mt-0.5 shrink-0 text-neutral-500">{icon}</span>
        <span className="min-w-0">
          <span className="block text-xs font-medium">{title}</span>
          <span className="block text-[11px] text-neutral-500">
            {description}
          </span>
        </span>
      </button>
    </li>
  );
}

// A collection already on the map shows its ring marker; others their source
function CollectionMarker({ dataSource }: { dataSource: ListedDataSource }) {
  const color = useMarkerLayerColor(dataSource.id);
  return color ? (
    <RingSwatch color={color} />
  ) : (
    <DataSourceIcon type={dataSource.config.type} />
  );
}
