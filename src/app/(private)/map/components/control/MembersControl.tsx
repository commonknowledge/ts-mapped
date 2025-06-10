import { MapRef } from "react-map-gl/mapbox";
import { DataSourcesQuery } from "@/__generated__/types";
import { mapColors } from "@/app/(private)/map/styles";
import { PointFeature } from "@/types";
import { MapConfig } from "../Controls";
import MemberList from "../lists/MemberList";
import SettingsModal from "../SettingsModal";
import SkeletonGroup from "../SkeletonGroup";
import LayerHeader from "./LayerHeader";

interface MembersControlProps {
  dataSource:
    | { name: string; markers: { features: PointFeature[] } }
    | undefined;
  mapRef: React.RefObject<MapRef | null>;
  isLoading?: boolean;
  mapConfig: MapConfig;
  onChangeConfig: (mapConfig: Partial<MapConfig>) => void;
  dataSources: DataSourcesQuery["dataSources"];
}

export default function MembersControl({
  dataSource,
  mapRef,
  isLoading = false,
  mapConfig,
  onChangeConfig,
  dataSources,
}: MembersControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Members"
        color={mapColors.member.color}
        showLayer={mapConfig.showMembers}
        setLayer={(show) => onChangeConfig({ showMembers: show })}
      >
        <SettingsModal
          mapConfig={mapConfig}
          onChangeConfig={onChangeConfig}
          dataSources={dataSources}
        />
      </LayerHeader>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <MemberList
          showMembers={mapConfig.showMembers}
          dataSource={dataSource}
          onSelect={(coordinates) => {
            const map = mapRef.current;
            if (map) {
              map.flyTo({
                center: coordinates,
                zoom: 12,
              });
            }
          }}
        />
      )}
    </div>
  );
}
