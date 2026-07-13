import { sortColumnValues } from "@/utils/sortColumnValues";
import { getCategoryColorsKey } from "../../colors";
import { MarkerIconShape, getMarkerIconImageId } from "./markerIcons";
import type { ColumnMetadata } from "@/models/DataSource";
import type { ExpressionSpecification } from "mapbox-gl";

/**
 * Resolve the colour for one column value: per-view override, then the
 * column's durable valueColors, then the layer fallback colour.
 */
export const resolveCategoryColor = ({
  dataSourceId,
  column,
  value,
  colorMappings,
  columnMetadata,
  fallbackColor,
}: {
  dataSourceId: string;
  column: string;
  value: string;
  colorMappings: Record<string, string> | undefined;
  columnMetadata: ColumnMetadata | undefined;
  fallbackColor: string;
}): string => {
  const mappingKey = getCategoryColorsKey(dataSourceId, column, value);
  return (
    colorMappings?.[mappingKey] ??
    columnMetadata?.valueColors?.[value] ??
    fallbackColor
  );
};

/**
 * Colour markers by column value. Falls back to the layer colour for
 * unknown/empty values.
 */
export const buildColorExpression = ({
  dataSourceId,
  column,
  values,
  colorMappings,
  columnMetadata,
  fallbackColor,
}: {
  dataSourceId: string;
  column: string;
  values: string[];
  colorMappings: Record<string, string> | undefined;
  columnMetadata: ColumnMetadata | undefined;
  fallbackColor: string;
}): string | ExpressionSpecification => {
  if (values.length === 0) {
    return fallbackColor;
  }
  const branches: string[] = [];
  for (const value of values) {
    branches.push(
      value,
      resolveCategoryColor({
        dataSourceId,
        column,
        value,
        colorMappings,
        columnMetadata,
        fallbackColor,
      }),
    );
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
