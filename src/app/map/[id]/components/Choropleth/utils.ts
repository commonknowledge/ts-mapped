import {
  CalculationType,
  DEFAULT_CALCULATION_TYPE,
} from "@/server/models/MapView";

export const getChoroplethDataKey = (viewConfig: {
  calculationType?: CalculationType | null | undefined;
  areaDataSourceId: string;
  areaDataColumn: string;
  areaDataSecondaryColumn?: string | null | undefined;
}) => {
  const calculationType =
    viewConfig.calculationType || DEFAULT_CALCULATION_TYPE;
  const parts: (string | null | undefined)[] = [
    viewConfig.areaDataSourceId,
    calculationType,
  ];
  if (viewConfig.calculationType !== CalculationType.Count) {
    parts.push(viewConfig.areaDataColumn);
    parts.push(viewConfig.areaDataSecondaryColumn);
  }
  return parts.filter(Boolean).join("-");
};
