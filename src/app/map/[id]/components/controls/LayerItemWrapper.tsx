import { EyeIcon, EyeOffIcon } from "lucide-react";
import { LayerType } from "@/types";
import { mapColors } from "../../styles";
import type { ReactNode } from "react";

export default function LayerItemWrapper({
  children,
  layerType,
  name,
  isVisible,
  onVisibilityToggle,
}: {
  children: ReactNode;
  name: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  layerType?: LayerType;
}) {
  const getLayerColor = () => {
    switch (layerType) {
      case LayerType.Member:
        return mapColors.member.color;
      case LayerType.Marker:
        return mapColors.markers.color;
      case LayerType.Turf:
        return mapColors.areas.color;
      default:
        return "var(--color-neutral-200)";
    }
  };

  return (
    <div className="relative flex gap-1 text-sm">
      <button
        className="shrink-0 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-2 cursor-pointer"
        aria-label={`Toggle ${name} visibility`}
        onClick={onVisibilityToggle}
      >
        {isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
      </button>

      <div
        className="absolute top-0 left-9 h-full w-1 shrink-0 rounded-xs"
        style={{ background: getLayerColor() }}
      ></div>

      <div className="w-full overflow-hidden">{children}</div>
    </div>
  );
}
