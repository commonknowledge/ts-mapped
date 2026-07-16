import { getCategoryColorScale } from "@/utils/colors";
import { parseRangeString, sortColumnValues } from "@/utils/sortColumnValues";
import { getCategoryColorsKey } from "../../colors";
import { MarkerIconShape, getMarkerIconImageId } from "./markerIcons";
import type { ColumnMetadata } from "@/models/DataSource";
import type { ExpressionSpecification } from "mapbox-gl";

/**
 * Map each column value to its display colour: per-view override, then the
 * column's durable valueColors, then a default from the shared categorical
 * scale. Values are resolved in canonical order so default assignment is
 * deterministic — pass the same value list everywhere (map + legend) to get
 * matching colours.
 */
export const buildCategoryColorMap = ({
  dataSourceId,
  column,
  values,
  colorMappings,
  columnMetadata,
}: {
  dataSourceId: string;
  column: string;
  values: string[];
  colorMappings: Record<string, string> | undefined;
  columnMetadata: ColumnMetadata | undefined;
}): Record<string, string> => {
  const ordered = sortColumnValues({ values, columnMetadata });
  const defaultColor = getCategoryColorScale(ordered);
  const colorMap: Record<string, string> = {};
  for (const value of ordered) {
    const mappingKey = getCategoryColorsKey(dataSourceId, column, value);
    colorMap[value] =
      colorMappings?.[mappingKey] ??
      columnMetadata?.valueColors?.[value] ??
      defaultColor(value);
  }
  return colorMap;
};

/**
 * Colour markers by column value. Falls back to the layer colour for
 * unknown/empty values.
 */
export const buildColorExpression = ({
  colorMap,
  column,
  fallbackColor,
}: {
  colorMap: Record<string, string>;
  column: string;
  fallbackColor: string;
}): string | ExpressionSpecification => {
  const entries = Object.entries(colorMap);
  if (entries.length === 0) {
    return fallbackColor;
  }
  const branches: string[] = [];
  for (const [value, color] of entries) {
    branches.push(value, color);
  }
  return [
    "match",
    ["to-string", ["get", column]],
    ...branches,
    fallbackColor,
  ] as ExpressionSpecification;
};

/**
 * Pick an icon image by column value from the column's valueIcons metadata.
 * Values without an assigned shape fall back to the circle.
 */
export const buildIconImageExpression = ({
  column,
  values,
  columnMetadata,
}: {
  column: string;
  values: string[];
  columnMetadata: ColumnMetadata | undefined;
}): string | ExpressionSpecification => {
  const fallbackImage = getMarkerIconImageId(MarkerIconShape.Circle);
  const valueIcons = columnMetadata?.valueIcons ?? {};
  const branches: string[] = [];
  for (const value of values) {
    const shape = valueIcons[value];
    if (shape) {
      branches.push(value, getMarkerIconImageId(shape));
    }
  }
  if (branches.length === 0) {
    return fallbackImage;
  }
  return [
    "match",
    ["to-string", ["get", column]],
    ...branches,
    fallbackImage,
  ] as ExpressionSpecification;
};

const MIN_SIZE_FACTOR = 0.6;
const MAX_SIZE_FACTOR = 1.8;

/**
 * Each column value's size factor, in canonical value order (valueOrder ->
 * range parsing -> alphabetical): values map onto the ramp smallest-first,
 * or largest-first when descending. Shared by the map expression and the
 * legend so displayed sizes always match the map.
 */
export const getOrderedSizeFactors = ({
  values,
  columnMetadata,
  descending,
}: {
  values: string[];
  columnMetadata: ColumnMetadata | undefined;
  descending: boolean | undefined;
}): { value: string; factor: number }[] => {
  const ordered = sortColumnValues({ values, columnMetadata });

  // On range-ordered columns, values with no explicit valueOrder position
  // and no parseable magnitude (e.g. "N/A") carry no ordinal meaning: they
  // get the smallest size rather than a ramp position. Columns where nothing
  // parses (hand-ordered or alphabetical ordinals) ramp every value as-is.
  const explicitOrder = new Set(columnMetadata?.valueOrder ?? []);
  const anyParseable = ordered.some((v) => parseRangeString(v) !== null);
  const ramped: string[] = [];
  const unrankable: string[] = [];
  for (const value of ordered) {
    if (
      anyParseable &&
      !explicitOrder.has(value) &&
      parseRangeString(value) === null
    ) {
      unrankable.push(value);
    } else {
      ramped.push(value);
    }
  }
  if (descending) {
    ramped.reverse();
  }

  const factors: { value: string; factor: number }[] = [];
  for (const value of unrankable) {
    factors.push({ value, factor: MIN_SIZE_FACTOR });
  }
  for (let i = 0; i < ramped.length; i++) {
    const t = ramped.length === 1 ? 1 : i / (ramped.length - 1);
    const factor = MIN_SIZE_FACTOR + t * (MAX_SIZE_FACTOR - MIN_SIZE_FACTOR);
    factors.push({ value: ramped[i], factor: Math.round(factor * 100) / 100 });
  }
  return factors;
};

/**
 * Scale markers by column value, ordinally: distinct values in their
 * canonical order (valueOrder -> range parsing -> alphabetical) map onto a
 * size ramp. Unknown/empty values get the smallest size.
 */
export const buildSizeFactorExpression = ({
  column,
  values,
  columnMetadata,
  descending,
}: {
  column: string;
  values: string[];
  columnMetadata: ColumnMetadata | undefined;
  descending: boolean | undefined;
}): number | ExpressionSpecification => {
  if (values.length === 0) {
    return 1;
  }
  const branches: (string | number)[] = [];
  for (const { value, factor } of getOrderedSizeFactors({
    values,
    columnMetadata,
    descending,
  })) {
    branches.push(value, factor);
  }
  return [
    "match",
    ["to-string", ["get", column]],
    ...branches,
    MIN_SIZE_FACTOR,
  ] as ExpressionSpecification;
};

/**
 * Draw-order sort key by column value: values earlier in the canonical order
 * (valueOrder -> range parsing -> alphabetical) get higher keys, so the value
 * at the top of the ordered list renders above the others when markers
 * overlap. Unknown/empty values sit underneath everything.
 */
export const buildSortKeyExpression = ({
  column,
  values,
  columnMetadata,
}: {
  column: string;
  values: string[];
  columnMetadata: ColumnMetadata | undefined;
}): number | ExpressionSpecification => {
  if (values.length === 0) {
    return 0;
  }
  const ordered = sortColumnValues({ values, columnMetadata });
  const branches: (string | number)[] = [];
  for (let i = 0; i < ordered.length; i++) {
    branches.push(ordered[i], ordered.length - i);
  }
  return [
    "match",
    ["to-string", ["get", column]],
    ...branches,
    0,
  ] as ExpressionSpecification;
};

/**
 * Display label for a category value: its valueLabel if set, otherwise the
 * value itself, with empty/whitespace values shown as "(blank)".
 */
export const formatCategoryValue = (
  value: string,
  valueLabels?: Record<string, string>,
): string => valueLabels?.[value] || value.trim() || "(blank)";

/**
 * Distinct scalar values of a column across loaded marker features, capped
 * to keep expressions small.
 */
export const getDistinctFeatureValues = (
  features: { properties: Record<string, unknown> }[],
  column: string,
  cap = 50,
): string[] => {
  const values = new Set<string>();
  for (const feature of features) {
    const value = feature.properties[column];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    values.add(String(value));
    if (values.size >= cap) {
      break;
    }
  }
  return [...values];
};
