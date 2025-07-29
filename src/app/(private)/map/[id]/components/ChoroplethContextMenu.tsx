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
  const { insertTurf, turfs } = useContext(MarkerAndTurfContext);
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

      // Check if area already exists
      const existingTurf = turfs.find(turf => 
        turf.label === areaName || 
        turf.notes.includes(areaCode)
      );
      
      if (existingTurf) {
        console.log("Area already exists:", existingTurf.label);
        alert(`"${areaName}" is already in your area list`);
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
      console.log("Feature properties:", completeFeature.properties);
      console.log("Area name:", areaName);
      console.log("Area code:", areaCode);
      
      // Debug coordinate bounds
      const geometry = completeFeature.geometry as any;
      if (geometry.coordinates && geometry.coordinates[0]) {
        const coords = geometry.coordinates[0];
        const lngs = coords.map((c: number[]) => c[0]);
        const lats = coords.map((c: number[]) => c[1]);
        console.log("Coordinate bounds:", {
          minLng: Math.min(...lngs),
          maxLng: Math.max(...lngs),
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          coordinateCount: coords.length
        });
      }

      // Ensure geometry is properly formatted and complete
      const processedGeometry = {
        type: geometry.type,
        coordinates: geometry.coordinates
      };

      // Create a new turf/area
      const newTurf = {
        id: uuidv4(),
        label: areaName,
        notes: `Added from ${choroplethLayerConfig.mapbox.sourceId} (${areaCode})`,
        area: 0, // You might want to calculate this from the geometry
        geometry: processedGeometry,
        mapId: mapRef.current.getStyle().name || "default", // You'll need to get the actual map ID
        createdAt: new Date(),
      };

      console.log("New turf being created:", newTurf);

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
  const areaCode = feature.properties?.[choroplethLayerConfig.mapbox.featureCodeProperty];
  
  // Check if area already exists
  const existingTurf = turfs.find(turf => 
    turf.label === areaName || 
    (areaCode && turf.notes.includes(areaCode))
  );

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
        disabled={isAdding || !!existingTurf}
        className={`w-full justify-start text-xs font-normal ${
          existingTurf ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        >
        {isAdding ? "Adding..." : existingTurf ? `${areaName} (Already Added)` : `Add ${areaName} to Area List`}
        
      </Button>
    </div>
  );
} 