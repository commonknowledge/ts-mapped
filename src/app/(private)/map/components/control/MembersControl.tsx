import MemberList from "../dataLists/MemberList";
import { Label } from "@/components/ui/label";
import { mapColors } from "@/lib/mapStyles";
import { MapRef } from "react-map-gl/mapbox";
import { MarkerData } from "@/types";
import { MarkersQuery } from "@/__generated__/types";
import { Skeleton } from "@/components/ui/skeleton";
import SkeletonGroup from "../SkeletonGroup";

interface MembersControlProps {
  members: MarkersQuery["markers"] | undefined;
  mapRef: React.RefObject<MapRef | null>;
  isLoading?: boolean;
}

export default function MembersControl({
  members,
  mapRef,
  isLoading = false,
}: MembersControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row gap-2 items-center">
        <div
          style={{ backgroundColor: mapColors.member.color }}
          className="rounded-full w-3 h-3"
        />
        <Label>Members</Label>
      </div>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <MemberList
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
