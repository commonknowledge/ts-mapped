import { ColumnType } from "@/models/DataSource";
import { CalculationType } from "@/models/MapView";
import { formatNumber } from "@/utils/text";

export const getDisplayValue = (
  value: unknown,
  config:
    | {
        calculationType?: CalculationType;
        columnType?: ColumnType;
        minValue?: number;
        maxValue?: number;
      }
    | null
    | undefined,
  valueLabels: Record<string, string> | null | undefined,
): string => {
  if (valueLabels && Object.keys(valueLabels).length) {
    if (value) {
      return valueLabels[String(value)] || String(value || "-");
    } else {
      return (
        valueLabels[String(value)] || valueLabels[""] || String(value || "-")
      );
    }
  }

  if (!config) {
    return String(value || "-");
  }

  const { calculationType, columnType, minValue, maxValue } = config;

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
