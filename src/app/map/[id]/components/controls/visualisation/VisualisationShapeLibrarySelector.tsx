import { Pentagon } from "lucide-react";
import React, { useMemo } from "react";
import { useState } from "react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { Label } from "@/shadcn/ui/label";

interface LocalityShapeItem {
  id: string;
  code: AreaSetGroupCode | null;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function VisualisationShapeLibrarySelector() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const [selectedValue, setSelectedValue] = useState<AreaSetGroupCode | null>(
    viewConfig.areaSetGroupCode || null,
  );

  const onSelect = (value: AreaSetGroupCode | null) => {
    setSelectedValue(value);
    updateViewConfig({ areaSetGroupCode: value });
  };

  // Helper function to get descriptions for boundary types
  const getBoundaryDescription = (code: AreaSetGroupCode): string => {
    switch (code) {
      case AreaSetGroupCode.WMC24:
        return "Westminster Parliamentary Constituencies for UK mapping";
      case AreaSetGroupCode.OA21:
        return "Census Output Areas for detailed area mapping";
      default:
        return "Geographic boundary data for mapping";
    }
  };

  // Dynamically generate locality shapes based on available AreaSetGroupCodes
  const localityShapes: LocalityShapeItem[] = useMemo(() => {
    const shapes: LocalityShapeItem[] = [
      // Always include "No Locality" option
      {
        id: "no-locality",
        code: null,
        name: "No locality",
        description: "Show no boundary shapes on the map",
        icon: <Pentagon className="w-4 h-4" />,
      },
    ];

    // Dynamically add all available boundary types from the enum
    Object.values(AreaSetGroupCode).forEach((code) => {
      shapes.push({
        id: code.toLowerCase(),
        code: code,
        name: AreaSetGroupCodeLabels[code],
        description: getBoundaryDescription(code),
        icon: <Pentagon className="w-4 h-4" />,
      });
    });

    return shapes;
  }, []);

  const renderLocalityShapeItem = (item: LocalityShapeItem) => {
    const isSelected = selectedValue === item.code;

    return (
      <div
        key={item.id}
        className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${isSelected ? "border-blue-500 bg-blue-50" : "border-neutral-200"
          }`}
        onClick={() => onSelect(item.code)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 bg-gradient-to-br ${item.code === null
                ? "from-neutral-400 to-neutral-600"
                : "from-blue-400 to-purple-500"
              } rounded-lg flex items-center justify-center text-white`}
          >
            {item.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{item.name}</h4>
              {item.code && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Boundary
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-600 mb-1">{item.description}</p>

            {/* Additional info for boundary types */}
            {item.code && (
              <div className="flex items-center gap-2">
                <Pentagon className="w-3 h-3 text-neutral-400" />
                <span className="text-xs text-neutral-500">
                  Geographic boundary data
                </span>
              </div>
            )}
          </div>

          {/* Selection indicator */}
          {isSelected && (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <Pentagon className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        <Pentagon className="w-4 h-4 text-muted-foreground" />
        Select map locality shapes
      </Label>

      <div className="space-y-2">
        {localityShapes.map(renderLocalityShapeItem)}
      </div>
    </div>
  );
}
