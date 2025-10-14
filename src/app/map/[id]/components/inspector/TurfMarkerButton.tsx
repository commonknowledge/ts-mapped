import LayerTypeIcon from "@/app/map/[id]/components/LayerTypeIcon";
import type { LayerType } from "@/types";

export default function TurfMarkerButton({
  label,
  type,
  onClick,
}: {
  label: string;
  type: LayerType;
  onClick: () => void;
}) {
  return (
    <button
      className="flex gap-2 w-full p-1 -mx-1 rounded cursor-pointer text-left transition-bg hover:bg-muted"
      onClick={onClick}
    >
      <LayerTypeIcon type={type} size={2} className="mt-[0.4em]" />

      {label}
    </button>
  );
}
