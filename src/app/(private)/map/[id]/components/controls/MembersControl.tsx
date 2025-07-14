import { useContext } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColours } from "@/app/(private)/map/[id]/styles";
import MemberList from "../lists/MemberList";
import SettingsModal from "../SettingsModal";
import LayerHeader from "./LayerHeader";

export default function MembersControl() {
  const { viewConfig, updateViewConfig } = useContext(MapContext);
  return (
    <div className="flex flex-col gap-1 px-4 pb-4">
      <LayerHeader
        label="Members"
        color={mapColours.member.color}
        showLayer={viewConfig.showMembers}
        setLayer={(show) => updateViewConfig({ showMembers: show })}
      >
        <SettingsModal />
      </LayerHeader>
      <MemberList />
    </div>
  );
}
