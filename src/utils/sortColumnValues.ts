import type { ColumnMetadata } from "@/models/DataSource";

export interface ParsedRange {
  start: number;
  end: number;
}

// Matches a number ("50") or a numeric range ("1-10", "1,000–5,000")
const RANGE_REGEX = /^\s*(\d[\d,.]*)(?:\s*[-–—]\s*(\d[\d,.]*))?\s*$/;

const parseRangeNumber = (raw: string): number => Number(raw.replace(/,/g, ""));

/**
 * Parse a numeric range string like "1-10" or "1,000–5,000" (also plain
 * numbers, which parse as a range of themselves). Returns null for anything
 * else.
 */
export function parseRangeString(value: string): ParsedRange | null {
  const match = RANGE_REGEX.exec(value);
  if (!match) {
    return null;
  }
  const start = parseRangeNumber(match[1]);
  const end = match[2] ? parseRangeNumber(match[2]) : start;
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return { start, end };
}

function compareParsedValues(a: string, b: string): number {
  const rangeA = parseRangeString(a);
  const rangeB = parseRangeString(b);
  if (rangeA && rangeB) {
    return rangeA.start - rangeB.start || rangeA.end - rangeB.end;
  }
  // Range-like values sort before anything unparseable
  if (rangeA) {
    return -1;
  }
  if (rangeB) {
    return 1;
  }
  return a.localeCompare(b);
}

/**
 * Sort categorical column values into their canonical ordinal order:
 *
 * 1. The column's explicit `valueOrder` metadata, when set (the only way to
 *    order non-numeric ordinals like Low < Moderate < High < Critical).
 * 2. Numeric range parsing per value ("1-10" < "10-25" < "1000-5000");
 *    values that don't parse sort after those that do.
 * 3. Alphabetical order as the final fallback.
 */
export function sortColumnValues({
  values,
  columnMetadata,
}: {
  values: string[];
  columnMetadata?: Pick<ColumnMetadata, "valueOrder"> | null;
}): string[] {
  const valueOrder = columnMetadata?.valueOrder;
  if (!valueOrder || valueOrder.length === 0) {
    return [...values].sort(compareParsedValues);
  }

  const orderIndex = new Map<string, number>();
  for (let i = 0; i < valueOrder.length; i++) {
    orderIndex.set(valueOrder[i], i);
  }

  return [...values].sort((a, b) => {
    const indexA = orderIndex.get(a);
    const indexB = orderIndex.get(b);
    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    }
    // Explicitly ordered values sort before unordered ones
    if (indexA !== undefined) {
      return -1;
    }
    if (indexB !== undefined) {
      return 1;
    }
    return compareParsedValues(a, b);
  });
}
