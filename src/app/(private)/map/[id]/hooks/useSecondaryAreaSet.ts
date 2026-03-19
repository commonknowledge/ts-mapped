import { useMemo } from "react";
import { getSecondaryAreaSetConfig } from "../components/Choropleth/configs";
import { useMapViews } from "./useMapViews";

export const useSecondaryAreaSetConfig = () => {
  const { viewConfig } = useMapViews();

  return useMemo(() => {
    return getSecondaryAreaSetConfig({
      areaSetCode: viewConfig.secondaryAreaSetCode,
      mapType: viewConfig.mapType,
    });
  }, [viewConfig.mapType, viewConfig.secondaryAreaSetCode]);
};
