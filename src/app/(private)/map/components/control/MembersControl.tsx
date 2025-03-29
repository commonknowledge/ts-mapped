import MemberList from "../dataLists/MemberList";
import { Label } from "@/shadcn/ui/label";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { MarkerData } from "@/types";
import { DataSourcesQuery, MarkersQuery } from "@/__generated__/types";
import { Skeleton } from "@/shadcn/ui/skeleton";
import SkeletonGroup from "../SkeletonGroup";
import { Eye, EyeOff, PlusIcon } from "lucide-react";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
import LayerHeader from "./LayerHeader";
import SettingsModal from "../SettingsModal";
import { MapConfig } from "../Controls";
import { Button } from "@/shadcn/ui/button";
import Link from "next/link";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";

interface MembersControlProps {
  members: MarkersQuery["markers"] | undefined;
  mapRef: React.RefObject<MapRef | null>;
  isLoading?: boolean;
  showMembers: boolean;
  setShowMembers: (showMembers: boolean) => void;
  mapConfig: MapConfig;
  onChange: (mapConfig: MapConfig) => void;
  dataSources: DataSourcesQuery["dataSources"];
}

export default function MembersControl({
  members,
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

        <IconButtonWithTooltip tooltip="Add Data">
          <Link href="/data-sources/new">
            <PlusIcon className="w-4 h-4" />
          </Link>
        </IconButtonWithTooltip>
      </LayerHeader>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <MemberList
          showMembers={showMembers}
          members={members}
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
