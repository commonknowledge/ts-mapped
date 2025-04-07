import { MapRef } from "react-map-gl/mapbox";
import { DataSourcesQuery, MarkersQuery } from "@/__generated__/types";
import { mapColors } from "@/app/(private)/map/styles";
import { MapConfig } from "../Controls";
import MemberList from "../dataLists/MemberList";
import SettingsModal from "../SettingsModal";
import SkeletonGroup from "../SkeletonGroup";
import LayerHeader from "./LayerHeader";

interface MembersControlProps {
  dataSource: MarkersQuery["dataSource"] | undefined;
  mapRef: React.RefObject<MapRef | null>;
  isLoading?: boolean;
  showMembers: boolean;
  setShowMembers: (showMembers: boolean) => void;
  mapConfig: MapConfig;
  onChange: (mapConfig: MapConfig) => void;
  dataSources: DataSourcesQuery["dataSources"];
}

export default function MembersControl({
  dataSource,
  mapRef,
  isLoading = false,
  showMembers,
  setShowMembers,
  mapConfig,
  onChange,
  dataSources,
}: MembersControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Members"
        color={mapColors.member.color}
        showLayer={showMembers}
        setLayer={setShowMembers}
      >
        <SettingsModal
          mapConfig={mapConfig}
          onChange={(nextConfig) =>
            onChange(new MapConfig({ ...mapConfig, ...nextConfig }))
          }
          dataSources={dataSources}
        />
      </LayerHeader>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <MemberList
          showMembers={showMembers}
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
