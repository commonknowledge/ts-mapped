import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { LayerType } from "@/types";
import MarkerButton from "./MarkerButton";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { MarkerFeature } from "@/types";

export const MembersList = ({
  markers,
  dataSource,
  areaType,
}: {
  markers: MarkerFeature[];
  dataSource: DataSource | null;
  areaType: "area" | "boundary";
}) => {
  const { setSelectedRecords } = useContext(InspectorContext);

  const total = markers.length;

  const onRecordClick = (marker: MarkerFeature) => {
    setSelectedRecords([
      {
        id: marker.properties.id,
        dataSourceId: marker.properties.dataSourceId,
        geocodePoint: {
          lng: marker.geometry.coordinates[0],
          lat: marker.geometry.coordinates[1],
        },
        name: marker.properties.name,
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this {areaType} {total > 0 && <>({total})</>}
      </h2>

      {!dataSource ? (
        <p>No members data source found.</p>
      ) : markers.length > 0 ? (
        <ul>
          {markers.map((marker) => {
            return (
              <li key={marker.properties.id}>
                <MarkerButton
                  label={marker.properties.name}
                  type={LayerType.Member}
                  onClick={() => onRecordClick(marker)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No members in this {areaType}.</p>
      )}
    </div>
  );
};

export const MarkersList = ({
  markers,
  dataSource,
}: {
  markers: MarkerFeature[];
  dataSource: DataSource | null;
}) => {
  const { setSelectedRecords } = useContext(InspectorContext);

  const total = markers.length;

  const onRecordClick = (marker: MarkerFeature) => {
    setSelectedRecords([
      {
        id: marker.properties.id,
        dataSourceId: marker.properties.dataSourceId,
        geocodePoint: {
          lng: marker.geometry.coordinates[0],
          lat: marker.geometry.coordinates[1],
        },
        name: marker.properties.name,
      },
    ]);
  };

  if (markers.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-semibold">
        <div className="shrink-0">
          <DataSourceIcon type={dataSource?.config.type}></DataSourceIcon>
        </div>
        {dataSource?.name} {total > 0 && <>({total})</>}
      </h3>

      <ul>
        {markers.map((marker) => {
          return (
            <li key={marker.properties.id}>
              <MarkerButton
                label={marker.properties.name}
                type={LayerType.Marker}
                onClick={() => onRecordClick(marker)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const PlacedMarkersList = ({
  folder,
  placedMarkers,
}: {
  folder: Folder | null;
  placedMarkers: PlacedMarker[];
}) => {
  const { setSelectedRecords } = useContext(InspectorContext);

  const total = placedMarkers.length;
  const name = folder?.name || "No folder";

  const onRecordClick = (marker: PlacedMarker) => {
    setSelectedRecords([
      {
        id: marker.id,
        geocodePoint: marker.point,
        name: marker.label,
      },
    ]);
  };

  if (placedMarkers.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        {name} ({total})
      </h3>

      <ul>
        {placedMarkers.map((marker) => {
          return (
            <li key={marker.id}>
              <MarkerButton
                label={marker.label}
                type={LayerType.Marker}
                onClick={() => onRecordClick(marker)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
