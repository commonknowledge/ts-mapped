import LayerTypeIcon from "@/app/(private)/map/[id]/components/LayerTypeIcon";
import type { LayerType } from "@/types";
import type { ReactNode } from "react";

export default function MarkerButton({
  label,
  type,
  icon,
  onClick,
}: {
  label: string;
  type: LayerType;
  /** Replaces the default layer-type bullet (e.g. the marker's map shape) */
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex gap-2 w-full p-1 -mx-1 rounded cursor-pointer text-left transition-bg hover:bg-muted"
      onClick={onClick}
    >
      {icon ? (
        <span className="shrink-0 mt-[0.3em]">{icon}</span>
      ) : (
        <LayerTypeIcon type={type} size={2} className="mt-[0.4em]" />
      )}

      {label}
    </button>
  );
}
