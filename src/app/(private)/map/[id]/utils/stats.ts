import { ColumnSemanticType, ColumnType } from "@/models/DataSource";
import { CalculationType } from "@/models/MapView";
import { formatNumber } from "@/utils/text";
import type { ColumnMetadata } from "@/models/DataSource";

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toPercentValue(
  num: number,
  semanticType?: ColumnSemanticType,
): number {
  if (semanticType === ColumnSemanticType.Percentage01) {
    return num * 100;
  }
  if (semanticType === ColumnSemanticType.Percentage0100) {
    return num;
  }
  return num > 1 ? num : num * 100;
}

export const parseColumnNumber = (
  value: unknown,
  {
    calculationType,
    columnMetadata,
  }: {
    calculationType: CalculationType | null | undefined;
    columnMetadata: ColumnMetadata | null | undefined;
  },
): number | null => {
  const num = parseNumeric(value);
  if (
    columnMetadata?.semanticType === ColumnSemanticType.Percentage01 ||
    columnMetadata?.semanticType === ColumnSemanticType.Percentage0100
  ) {
    return toPercentValue(num || 0, columnMetadata.semanticType);
  }
  return calculationType === CalculationType.Count ? num || 0 : num;
};

export const getDisplayValue = (
  value: unknown,
  config: {
    calculationType: CalculationType | null | undefined;
    columnMetadata: ColumnMetadata | null | undefined;
    columnType: ColumnType | null | undefined;
  },
): string => {
  const { calculationType, columnType, columnMetadata } = config;
  const { valueLabels, semanticType } = columnMetadata || {};

  const num = parseColumnNumber(value, { calculationType, columnMetadata });

  if (valueLabels && Object.keys(valueLabels).length) {
    if (value) {
      return valueLabels[String(value)] || String(value || "-");
    } else {
      return (
        valueLabels[String(value)] || valueLabels[""] || String(value || "-")
      );
    }
  }

  if (value === undefined || value === null || value === "") {
    return calculationType === CalculationType.Count ? "0" : "-";
  }

  if (columnType !== ColumnType.Number || num === null) {
    return String(value);
  }

  if (
    semanticType === ColumnSemanticType.Percentage01 ||
    semanticType === ColumnSemanticType.Percentage0100
  ) {
    return `${Math.round(num * 10) / 10}%`;
  }

  return formatNumber(num);
};
