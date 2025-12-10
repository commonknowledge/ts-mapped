import { ArrowRight, PlusIcon } from "lucide-react";
import { useState } from "react";

import { useTurfState } from "@/app/map/[id]/hooks/useTurfState";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { LayerType } from "@/types";
import { useTurfsQuery } from "../../../hooks/useTurfs";
import LayerControlWrapper from "../LayerControlWrapper";
import EmptyLayer from "../LayerEmptyMessage";
import LayerHeader from "../LayerHeader";
import TurfItem from "./TurfItem";

export default function AreasControl() {
  const { handleAddArea } = useTurfState();
  const [isAddingArea, setAddingArea] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const { data: turfs = [] } = useTurfsQuery();

  const onAddArea = () => {
    handleAddArea();
    setAddingArea(true);

    setTimeout(() => {
      setAddingArea(false);
    }, 5000);
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
        {!isAddingArea ? (
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
        <div className="relative pt-2">
          {turfs && turfs.length === 0 && (
            <EmptyLayer message="Add an Area Layer" />
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
