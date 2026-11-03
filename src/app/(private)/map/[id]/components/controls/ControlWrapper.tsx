import { EyeIcon, EyeOffIcon, Settings2Icon } from "lucide-react";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { INK_COLOR, mapColors } from "../../styles";
import LayerTypeIcon from "../LayerTypeIcon";
import { useLayerRowVariant } from "./LayerRowVariantContext";
import type { ReactNode } from "react";

export default function ControlWrapper({
  children,
  layerType,
  name,
  isVisible,
  onVisibilityToggle,
  color,
  onOpenSettings,
  onColorChange,
  showTypeIcon = true,
}: {
  children: ReactNode;
  name: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  layerType?: LayerType;
  color?: string;
  /** When provided, shows a settings button next to the visibility toggle. */
  onOpenSettings?: () => void;
  /** Light rows: makes the colour swatch editable */
  onColorChange?: (color: string) => void;
  /** Light rows: show the layer type's icon (off for folders) */
  showTypeIcon?: boolean;
}) {
  const variant = useLayerRowVariant();
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

  if (variant === "light" && layerType === LayerType.Marker) {
    // Marker rows match the light editor's collection rows: their ring
    // marker on the left doubles as the visibility toggle
    const ringColor = getLayerColor();
    return (
      <div className="group relative flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-neutral-50">
        <button
          type="button"
          onClick={onVisibilityToggle}
          aria-pressed={isVisible}
          aria-label={`${isVisible ? "Hide" : "Show"} ${name}`}
          title={isVisible ? "Hide on map" : "Show on map"}
          className={cn(
            "shrink-0 cursor-pointer rounded-full transition-[opacity,filter,transform] hover:scale-110",
            !isVisible && "opacity-30 grayscale",
          )}
        >
          <svg
            aria-hidden
            width={14}
            height={14}
            viewBox="0 0 14 14"
            className="drop-shadow-[0_0_0.5px_rgba(0,0,0,0.4)]"
          >
            <circle cx={7} cy={7} r={7} fill="#ffffff" />
            <circle cx={7} cy={7} r={6} fill={ringColor} />
            <circle cx={7} cy={7} r={3.5} fill={INK_COLOR} />
          </svg>
        </button>
        <div
          className={cn(
            "min-w-0 grow transition-opacity",
            !isVisible && "opacity-50",
          )}
        >
          {children}
        </div>
        {onOpenSettings && (
          <button
            className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Open ${name} settings`}
            title="Settings"
            onClick={onOpenSettings}
          >
            <Settings2Icon size={14} />
          </button>
        )}
      </div>
    );
  }

  if (variant === "light") {
    const swatchColor = getLayerColor();
    return (
      <div
        className={cn(
          "group relative flex items-center gap-1 text-sm",
          !isVisible && "opacity-60",
        )}
      >
        {showTypeIcon && layerType === LayerType.Turf && (
          <LayerTypeIcon
            type={LayerType.Turf}
            size={14}
            className="text-neutral-400"
          />
        )}
        <div className="min-w-0 grow">{children}</div>
        {onOpenSettings && (
          <button
            className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Open ${name} settings`}
            title="Settings"
            onClick={onOpenSettings}
          >
            <Settings2Icon size={14} />
          </button>
        )}
        {onColorChange ? (
          <label
            title="Colour"
            className="relative size-5 shrink-0 cursor-pointer rounded-full border-2 border-white shadow-[0_0_0_1px_#d4d4d4]"
            style={{ backgroundColor: swatchColor }}
          >
            <input
              type="color"
              value={swatchColor}
              onChange={(e) => onColorChange(e.target.value)}
              aria-label={`${name} colour`}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        ) : (
          <span
            aria-hidden
            className="size-5 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_1px_#d4d4d4]"
            style={{ backgroundColor: swatchColor }}
          />
        )}
        {/* Same width as the "+" and remove buttons, so swatches line up */}
        <button
          className={cn(
            "flex w-6 shrink-0 cursor-pointer justify-center rounded py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900",
            isVisible &&
              "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
          aria-label={`Toggle ${name} visibility`}
          onClick={onVisibilityToggle}
        >
          {isVisible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
        </button>
      </div>
    );
  }

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
