import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

import { useMemo } from "react";

import { AreaSetCodeLabels } from "@/labels";
import { useDisplayAreaStats } from "../../hooks/useDisplayAreaStats";
import { useHoverArea, useHoverSecondaryArea } from "../../hooks/useMapHover";
import { useSecondaryAreaSetConfig } from "../../hooks/useSecondaryAreaSet";
import { useSelectedAreas } from "../../hooks/useSelectedAreas";
import { AreasList } from "./AreasList";

export default function BoundaryHoverInfo() {
  const [selectedAreas, setSelectedAreas] = useSelectedAreas();
  const [hoverArea] = useHoverArea();
  const [hoverSecondaryArea] = useHoverSecondaryArea();
  const secondaryAreaSetConfig = useSecondaryAreaSetConfig();

  const allAreas = useMemo(() => {
    const areas = [];

    // Add all selected areas
    for (const selectedArea of selectedAreas) {
      areas.push({
        code: selectedArea.code,
        name: selectedArea.name,
        areaSetCode: selectedArea.areaSetCode,
        coordinates: selectedArea.coordinates,
        isSelected: true,
      });
    }

    // Add hover area only if it's not already in selected areas
    if (hoverArea) {
      const isHoverAreaSelected = selectedAreas.some(
        (a) =>
          a.code === hoverArea.code && a.areaSetCode === hoverArea.areaSetCode,
      );
      if (!isHoverAreaSelected) {
        areas.push({
          code: hoverArea.code,
          name: hoverArea.name,
          areaSetCode: hoverArea.areaSetCode,
          coordinates: hoverArea.coordinates,
          isSelected: false,
        });
      }
    }

    return areas;
  }, [hoverArea, selectedAreas]);

  const { areasToDisplay, primaryLabel, secondaryLabel } =
    useDisplayAreaStats(allAreas);

  const showInfo = areasToDisplay.length > 0 || hoverSecondaryArea;

  return (
    <AnimatePresence mode="wait">
      {showInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, type: "tween" }}
          className="bg-white rounded shadow-lg py-1 pr-8 relative pointer-events-none"
        >
          {selectedAreas.length > 0 && (
            <button
              className="absolute top-2 right-2 p-1 cursor-pointer hover:bg-neutral-100 rounded transition-colors z-20 pointer-events-auto"
              aria-label="Clear selected areas"
              onClick={() => setSelectedAreas([])}
            >
              <XIcon
                size={16}
                className="text-neutral-600 hover:text-neutral-900"
              />
            </button>
          )}
          {areasToDisplay.length > 0 && (
            <AreasList
              areas={areasToDisplay}
              primaryLabel={primaryLabel}
              secondaryLabel={secondaryLabel}
              setSelectedAreas={setSelectedAreas}
            />
          )}
          {hoverSecondaryArea && secondaryAreaSetConfig && (
            <>
              {areasToDisplay.length > 0 && (
                <hr className="border-neutral-200 mx-3 my-1" />
              )}
              <div className="px-3 py-1 flex flex-row items-center font-medium">
                <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                  {AreaSetCodeLabels[secondaryAreaSetConfig.areaSetCode] ||
                    "Secondary boundary"}
                  :
                </span>
                <span className="text-sm">{hoverSecondaryArea.name}</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
