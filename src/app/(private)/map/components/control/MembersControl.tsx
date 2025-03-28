import MemberList from "../dataLists/MemberList";
import { Label } from "@/shadcn/components/ui/label";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { MarkerData } from "@/types";
import { MarkersQuery } from "@/__generated__/types";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import SkeletonGroup from "../SkeletonGroup";
import { Toggle } from "@/shadcn/components/ui/toggle";
import { Eye, EyeOff } from "lucide-react";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
import LayerHeader from "./LayerHeader";

interface MembersControlProps {
  members: MarkersQuery["markers"] | undefined;
  mapRef: React.RefObject<MapRef | null>;
  isLoading?: boolean;
  showMembers: boolean;
  setShowMembers: (showMembers: boolean) => void;
}

export default function MembersControl({
  members,
  mapRef,
  isLoading = false,
  showMembers,
  setShowMembers,
}: MembersControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Members"
        color={mapColors.member.color}
        showLayer={showMembers}
        setLayer={setShowMembers}
      />
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
