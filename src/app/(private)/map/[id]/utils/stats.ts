import { ColumnSemanticType, ColumnType } from "@/models/DataSource";
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
    isCount,
    columnMetadata,
  }: {
    isCount: boolean;
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
  return isCount ? num || 0 : num;
};

/**
 * Arrays (and the numeric-keyed objects that imported JSON arrays become)
 * as element lists; null for anything else.
 */
const asCollection = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return Object.values(value);
    }
  }
  return null;
};

export const getDisplayValue = (
  value: unknown,
  config: {
    isCount: boolean;
    columnMetadata: ColumnMetadata | null | undefined;
    columnType: ColumnType | null | undefined;
  },
): string => {
  const { isCount, columnType, columnMetadata } = config;
  const { valueLabels, semanticType } = columnMetadata || {};

  // Multi-value columns (Airtable multi-selects, linked records) display as
  // a comma-joined list, formatting each element (so valueLabels etc. apply)
  const collection = asCollection(value);
  if (collection) {
    if (collection.length === 0) {
      return isCount ? "0" : "-";
    }
    return collection.map((v) => getDisplayValue(v, config)).join(", ");
  }
  // Other non-null objects have no readable string form
  if (value && typeof value === "object") {
    return "-";
  }

  const num = parseColumnNumber(value, { isCount, columnMetadata });

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
    return isCount ? "0" : "-";
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
