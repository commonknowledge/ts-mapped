import { useContext } from "react";
import { MapContext } from "@/app/(private)/map/context/MapContext";
import { mapColors } from "@/app/(private)/map/styles";
import MemberList from "../lists/MemberList";
import SettingsModal from "../SettingsModal";
import LayerHeader from "./LayerHeader";

export default function MembersControl() {
  const { mapConfig, updateMapConfig } = useContext(MapContext);
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Members"
        color={mapColors.member.color}
        showLayer={mapConfig.showMembers}
        setLayer={(show) => updateMapConfig({ showMembers: show })}
      >
        <SettingsModal />
      </LayerHeader>
      <MemberList />
    </div>
  );
}
