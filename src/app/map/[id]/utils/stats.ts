import { ColumnType } from "@/server/models/DataSource";
import { CalculationType } from "@/server/models/MapView";
import { formatNumber } from "@/utils/text";

export const getDisplayValue = (
  value: unknown,
  {
    calculationType,
    columnType,
    minValue,
    maxValue,
  }: {
    calculationType?: CalculationType;
    columnType?: ColumnType;
    minValue?: number;
    maxValue?: number;
  },
): string => {
  if (value === undefined || value === null || value === "") {
    return calculationType === CalculationType.Count ? "0" : "-";
  }
  if (columnType !== ColumnType.Number) {
    return String(value);
  }
  const nValue = Number(value);
  if (isNaN(nValue)) {
    return "-";
  }
  if (
    typeof minValue === "number" &&
    typeof maxValue === "number" &&
    minValue >= 0 &&
    maxValue <= 1
  ) {
    return `${Math.round(nValue * 1000) / 10}%`;
  }
  return formatNumber(nValue);
};
