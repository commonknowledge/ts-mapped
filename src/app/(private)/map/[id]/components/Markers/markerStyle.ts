import { getCategoryColorScale } from "@/utils/colors";
import { sortColumnValues } from "@/utils/sortColumnValues";
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
  const ordered = sortColumnValues({ values, columnMetadata });
  if (descending) {
    ordered.reverse();
  }
  const branches: (string | number)[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const t = ordered.length === 1 ? 1 : i / (ordered.length - 1);
    const factor = MIN_SIZE_FACTOR + t * (MAX_SIZE_FACTOR - MIN_SIZE_FACTOR);
    branches.push(ordered[i], Math.round(factor * 100) / 100);
  }
  return [
    "match",
    ["to-string", ["get", column]],
    ...branches,
    MIN_SIZE_FACTOR,
  ] as ExpressionSpecification;
};

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
