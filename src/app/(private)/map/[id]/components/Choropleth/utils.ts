import type { CalculationType } from "@/models/shared";

export const getChoroplethDataKey = (viewConfig: {
  calculationType: CalculationType;
  areaDataSourceId: string;
  areaDataColumn: string;
  areaDataSecondaryColumn?: string | null | undefined;
}) => {
  const parts: (string | null | undefined)[] = [
    viewConfig.areaDataSourceId,
    viewConfig.calculationType,
    viewConfig.areaDataColumn,
    viewConfig.areaDataSecondaryColumn,
  ];
  return parts.filter(Boolean).join("-");
};
