import LayerIcon from "@/components/LayerIcon";
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
      className="flex gap-2 w-full p-1 -mx-1 items-center rounded cursor-pointer text-left transition-bg hover:bg-muted"
      onClick={onClick}
    >
      <LayerIcon type={type} size="sm" />

      {label}
    </button>
  );
}
