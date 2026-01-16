import { ArrowRight, PlusIcon } from "lucide-react";
import { useState } from "react";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { LayerType } from "@/types";
import {
  useEditAreaMode,
  useSetEditAreaMode,
} from "../../../hooks/useMapControls";
import { useTurfsQuery } from "../../../hooks/useTurfsQuery";
import { useTurfState } from "../../../hooks/useTurfState";
import LayerControlWrapper from "../LayerControlWrapper";
import EmptyLayer from "../LayerEmptyMessage";
import LayerHeader from "../LayerHeader";
import TurfItem from "./TurfItem";

export default function AreasControl() {
  const { handleAddArea } = useTurfState();
  const editAreaMode = useEditAreaMode();
  const setEditAreaMode = useSetEditAreaMode();
  const [expanded, setExpanded] = useState(true);
  const { data: turfs = [] } = useTurfsQuery();

  const onAddArea = () => {
    if (editAreaMode) {
      setEditAreaMode(false);
    } else {
      setEditAreaMode(true);
      handleAddArea();
    }
  };

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Areas"
        type={LayerType.Turf}
        expanded={expanded}
        setExpanded={setExpanded}
        enableVisibilityToggle={Boolean(turfs?.length)}
      >
        {!editAreaMode ? (
          <IconButtonWithTooltip tooltip="Add Area" onClick={() => onAddArea()}>
            <PlusIcon className="w-4 h-4" />
          </IconButtonWithTooltip>
        ) : (
          <div className="flex text-xs items-center text-muted-foreground gap-0.5">
            <span>Draw</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </LayerHeader>

      {expanded && (
        <div className="relative px-4 pb-6 pt-2">
          {turfs && turfs.length === 0 && (
            <EmptyLayer
              message="Add an Area Layer"
              onClick={onAddArea}
              showAsButton
            />
          )}
          <ul className="flex flex-col gap-1 ml-1">
            {turfs.map((turf) => (
              <li key={turf.id}>
                <TurfItem turf={turf} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </LayerControlWrapper>
  );
}
