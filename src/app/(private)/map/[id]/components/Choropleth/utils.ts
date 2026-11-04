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

/**
 * A fill colour expression rewritten to read the previous view's values
 * ("prevValue", "prevSecondaryValue" feature state), so the old colours can
 * stay on screen while the new ones fade in
 */
export const withPreviousValues = <T>(expression: T): T =>
  JSON.parse(
    JSON.stringify(expression).replace(
      /\["feature-state","(value|secondaryValue)"\]/g,
      (_, name: string) =>
        `["feature-state","prev${name.charAt(0).toUpperCase()}${name.slice(1)}"]`,
    ),
    // The same expression, only reading differently named feature state
  ) as T;
