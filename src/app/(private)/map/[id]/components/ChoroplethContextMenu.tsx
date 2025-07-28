"use client";

import { useContext, useEffect, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { ChoroplethContext } from "@/app/(private)/map/[id]/context/ChoroplethContext";
import { Button } from "@/shadcn/ui/button";
import { v4 as uuidv4 } from "uuid";

interface ChoroplethContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number } | null;
  feature: any;
  onClose: () => void;
}

export default function ChoroplethContextMenu({
  isVisible,
  position,
  feature,
  onClose,
}: ChoroplethContextMenuProps) {
  const { mapRef } = useContext(MapContext);
  const { insertTurf } = useContext(MarkerAndTurfContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    if (isVisible) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isVisible, onClose]);

  const handleAddToArea = async () => {
    if (!feature || !mapRef?.current) return;

    setIsAdding(true);
    
    try {
      // Get the area name and code from the feature
      const areaName = feature.properties?.[choroplethLayerConfig.mapbox.featureNameProperty];
      const areaCode = feature.properties?.[choroplethLayerConfig.mapbox.featureCodeProperty];
      
      if (!areaName || !areaCode) {
        console.error("Missing area name or code");
        return;
      }

      // Get the complete geometry from the source
      const source = mapRef.current.getSource(choroplethLayerConfig.mapbox.sourceId);
      if (!source || source.type !== 'vector') {
        console.error("Source not found or not a vector source");
        return;
      }

      // Query the source to get the complete feature geometry
      const completeFeatures = mapRef.current.querySourceFeatures(choroplethLayerConfig.mapbox.sourceId, {
        sourceLayer: choroplethLayerConfig.mapbox.layerId,
        filter: ['==', choroplethLayerConfig.mapbox.featureCodeProperty, areaCode]
      });

      if (completeFeatures.length === 0) {
        console.error("Complete feature not found");
        return;
      }

      const completeFeature = completeFeatures[0];
      console.log("Complete feature geometry:", completeFeature.geometry);

      // Create a new turf/area
      const newTurf = {
        id: uuidv4(),
        label: areaName,
        notes: `Added from ${choroplethLayerConfig.mapbox.sourceId}`,
        area: 0, // You might want to calculate this from the geometry
        geometry: completeFeature.geometry,
        mapId: mapRef.current.getStyle().name || "default", // You'll need to get the actual map ID
        createdAt: new Date(),
      };

      await insertTurf(newTurf);
      onClose();
    } catch (error) {
      console.error("Failed to add area:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isVisible || !position || !feature) {
    return null;
  }

  const areaName = feature.properties?.[choroplethLayerConfig.mapbox.featureNameProperty] || "Unknown Area";

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg "
      style={{
        left: Math.max(0, position.x + 200), // Adjust for menu width (min-w-48 = 12rem = 192px)
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      
      <Button
        size="sm"
        onClick={handleAddToArea}
        disabled={isAdding}
        className="w-full justify-start text-xs  font-normal"
        >
        {isAdding ? "Adding..." : `Add ${areaName} to Area List`}
        
      </Button>
    </div>
  );
} 