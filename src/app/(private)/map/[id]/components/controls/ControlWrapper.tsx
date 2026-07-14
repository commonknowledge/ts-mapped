import { EyeIcon, EyeOffIcon, Settings2Icon } from "lucide-react";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { mapColors } from "../../styles";
import type { ReactNode } from "react";

export default function ControlWrapper({
  children,
  layerType,
  name,
  isVisible,
  onVisibilityToggle,
  color,
  onOpenSettings,
}: {
  children: ReactNode;
  name: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  layerType?: LayerType;
  color?: string;
  /** When provided, shows a settings button next to the visibility toggle. */
  onOpenSettings?: () => void;
}) {
  const getLayerColor = () => {
    // Use custom color if provided, otherwise use default layer color
    if (color) {
      return color;
    }
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
    <div
      className={cn(
        "group relative flex gap-1 text-sm",
        isVisible ? "opacity-100" : "opacity-70",
      )}
    >
      <div
        className="absolute top-0 left-0 h-full w-1 shrink-0 rounded-xs"
        style={{ background: getLayerColor() }}
      ></div>

      <div className="grow pl-3">{children}</div>

      {onOpenSettings && (
        <button
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded p-1.5 flex items-center justify-center cursor-pointer"
          aria-label={`Open ${name} settings`}
          title="Marker settings"
          onClick={onOpenSettings}
        >
          <Settings2Icon size={16} />
        </button>
      )}
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded p-1.5 flex items-center justify-center cursor-pointer"
        aria-label={`Toggle ${name} visibility`}
        onClick={onVisibilityToggle}
      >
        {isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
      </button>
    </div>
  );
}
