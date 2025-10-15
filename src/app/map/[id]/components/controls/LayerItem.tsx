import { Eye, EyeOff } from "lucide-react";
import React, { useContext } from "react";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { mapColors } from "../../styles";

interface LayerItemProps {
  children: React.ReactNode;
  isVisible?: boolean;
  onVisibilityToggle?: () => void;
  onClick?: (e: React.SyntheticEvent<HTMLElement, Event>) => void;
  className?: string;
  showEyeIcon?: boolean;
  layerType?: "members" | "locations" | "areas";
  isDataSource?: boolean;
  dataSourceId?: string; // ID of the data source for individual visibility control
  individualVisibility?: boolean; // New prop for individual visibility control
  noColorBar?: boolean;
}

export default function LayerItem({
  children,
  isVisible,
  onVisibilityToggle,
  onClick,
  className = "",
  showEyeIcon = true,
  layerType = "locations",
  isDataSource = false,
  dataSourceId,
  individualVisibility = false,
  noColorBar = false,
}: LayerItemProps) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const { getDataSourceVisibility, setDataSourceVisibilityState } =
    useContext(MarkerAndTurfContext);

  // Determine visibility state
  const getVisibilityState = () => {
    if (isVisible !== undefined) {
      return isVisible;
    }

    // If this is a data source, use individual data source visibility
    if (isDataSource && dataSourceId) {
      return getDataSourceVisibility(dataSourceId);
    }

    // If individual visibility is enabled, we need a custom visibility state
    if (individualVisibility) {
      // For individual visibility, we'll use a local state or custom logic
      // This will be handled by the parent component
      return true; // Default to visible, parent should control this
    }

    switch (layerType) {
      case "members":
        return viewConfig.showMembers;
      case "locations":
        return viewConfig.showLocations;
      case "areas":
        return viewConfig.showTurf;
      default:
        return true;
    }
  };

  const visibilityState = getVisibilityState();

  const color =
    layerType === "members"
      ? mapColors.member.color
      : layerType === "locations"
        ? mapColors.markers.color
        : mapColors.areas.color;

  // Handle visibility toggle
  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onVisibilityToggle) {
      onVisibilityToggle();
    } else if (isDataSource && dataSourceId) {
      // Toggle individual data source visibility
      setDataSourceVisibilityState(
        dataSourceId,
        !getDataSourceVisibility(dataSourceId),
      );
    } else if (individualVisibility) {
      console.warn(
        "Individual visibility enabled but no onVisibilityToggle handler provided",
      );
    } else {
      // Global layer visibility toggle
      switch (layerType) {
        case "members":
          updateViewConfig({ showMembers: !viewConfig.showMembers });
          break;
        case "locations":
          updateViewConfig({ showLocations: !viewConfig.showLocations });
          break;
        case "areas":
          updateViewConfig({ showTurf: !viewConfig.showTurf });
          break;
      }
    }
  };

  return (
    <div
      className={`flex items-center bg-white rounded cursor-pointer group relative ${className} ${!visibilityState ? "opacity-50" : ""}`}
      onClick={onClick}
    >
      {showEyeIcon && (
        <button
          onClick={handleVisibilityToggle}
          className="bg-neutral-100 hover:bg-neutral-200 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-1"
        >
          {visibilityState ? (
            <Eye className="w-4 h-4 text-neutral-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      )}
      {!noColorBar && (
        <div
          className="w-1 self-stretch mr-2 rounded"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="flex-1 min-w-0 flex items-center gap-1">{children}</div>
    </div>
  );
}
