import { v4 as uuidv4 } from "uuid";
import { PARTY_COLORS } from "@/constants/colors";
import { ColumnSemanticType, ColumnType } from "@/models/DataSource";
import { ColumnDisplayFormat } from "@/models/shared";
import { SMART_MATCH_BAR_COLOR_VALUE } from "../components/InspectorPanel/inspectorPanelOptions";
import type {
  ColumnDef,
  ColumnMetadata,
  GeocodingConfig,
} from "@/models/DataSource";
import type { InspectorItem } from "@/models/shared";

type ColumnItem = Extract<InspectorItem, { type: "column" }>;

// Identifiers: ONS-style codes and names (oa21cd, wd23nm), ids, keys, refs
const ID_NAME = /(^|[_\s-])(id|uuid|guid|key|ref|fid|objectid|code|cd)$/i;
const ONS_FIELD = /^[a-z]{2,5}\d{2}(cd|nm|nmw)$/i;
// Unnamed spreadsheet columns: "f1", "Field 2", "Unnamed: 3", "column_4"
const UNNAMED = /^(f|field|col|column|unnamed:?)[_\s]?\d+$/i;
const COORDINATE =
  /^(lat|lng|lon|long|latitude|longitude|easting|northing|x|y)$/i;
// Values that are area codes (E00133029) or bare identifiers (ABC-00123)
const ONS_CODE = /^[EWSNKL]\d{8}$/;
const ID_VALUE = /^[A-Z0-9_-]*\d[A-Z0-9_-]*$/i;

const PERCENT_NAME = /(%|pct|percent|share|proportion|rate|ratio)/i;
const SCALE_NAME = /(score|rating|level|rank|decile|quintile|quartile|band)/i;
const BOOLEAN_VALUES = new Set(["true", "false", "yes", "no", "y", "n"]);
const LARGE_TEXT_LENGTH = 80;

export interface AutoScanResult {
  /** The columns kept, in order */
  items: ColumnItem[];
  /** What to save: the columns, with party shares grouped under a bar chart */
  layoutItems: InspectorItem[];
  /** Party columns grouped into the bar chart, if any */
  chartedColumns: number;
  layout: "single" | "twoColumn";
  /** Semantic types worth recording so percentages display as such */
  metadataPatches: { column: string; semanticType: ColumnSemanticType }[];
  hidden: { column: string; reason: string }[];
}

// Whole words only, so "ld" (Lib Dems) doesn't match inside "field"
const isPartyColumn = (name: string, displayName?: string) =>
  [name, displayName].filter(Boolean).some((label) => {
    const words = String(label)
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean);
    return (
      Boolean(PARTY_COLORS[words.join(" ")]) ||
      words.some((word) => Boolean(PARTY_COLORS[word]))
    );
  });

const isEmpty = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === "";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value.replace(/[,%]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const geocodingColumns = (config: GeocodingConfig | null | undefined) => {
  if (!config) return [];
  if ("column" in config) return [config.column];
  if ("columns" in config) return config.columns;
  if ("latitudeColumn" in config) {
    return [config.latitudeColumn, config.longitudeColumn];
  }
  return [];
};

/**
 * Looks at a sample of records and suggests an inspector section: hides
 * identifiers, location fields and empty columns, picks a display
 * format from the values, and puts the columns on the map first.
 */
export const scanInspectorColumns = ({
  columnDefs,
  columnMetadata,
  samples,
  geocodingConfig,
  priorityColumns = [],
}: {
  columnDefs: ColumnDef[];
  columnMetadata: ColumnMetadata[];
  samples: Record<string, unknown>[];
  geocodingConfig?: GeocodingConfig | null;
  /** Columns to keep and lead with, e.g. those coloured on the map */
  priorityColumns?: string[];
}): AutoScanResult => {
  const metaByName = new Map(columnMetadata.map((m) => [m.name, m]));
  const locationColumns = geocodingColumns(geocodingConfig);
  const hidden: AutoScanResult["hidden"] = [];
  const metadataPatches: AutoScanResult["metadataPatches"] = [];
  const kept: { item: ColumnItem; rank: number }[] = [];

  columnDefs.forEach((col, index) => {
    const name = col.name;
    const isPriority = priorityColumns.includes(name);
    const values = samples.map((s) => s[name]).filter((v) => !isEmpty(v));
    const hide = (reason: string) => hidden.push({ column: name, reason });

    if (!isPriority) {
      if (col.type === ColumnType.Empty || values.length === 0) {
        return hide("empty");
      }
      if (locationColumns.includes(name) || COORDINATE.test(name)) {
        return hide("location");
      }
      if (UNNAMED.test(name)) return hide("unnamed");
      if (ID_NAME.test(name) || ONS_FIELD.test(name)) {
        return hide("identifier");
      }
      const strings = values.map((v) => String(v).trim());
      if (strings.every((v) => ONS_CODE.test(v))) return hide("identifier");
      if (
        col.type === ColumnType.String &&
        values.length > 5 &&
        new Set(strings).size === strings.length &&
        strings.every((v) => ID_VALUE.test(v) && !/\s/.test(v))
      ) {
        return hide("identifier");
      }
    }

    const meta = metaByName.get(name);
    const numbers = values.map(toNumber);
    const allNumeric =
      values.length > 0 && numbers.every((n): n is number => n !== null);
    const strings = values.map((v) => String(v).trim().toLowerCase());
    let displayFormat = ColumnDisplayFormat.Text;
    let scaleMax: number | undefined;
    // Rank: on the map first, then figures, then text, long text last
    let rank = 2;

    if (
      col.type === ColumnType.Boolean ||
      (values.length > 0 && strings.every((v) => BOOLEAN_VALUES.has(v)))
    ) {
      displayFormat = ColumnDisplayFormat.Boolean;
    } else if (allNumeric && col.type !== ColumnType.String) {
      const nums = numbers.filter((n): n is number => n !== null);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const allIntegers = nums.every(Number.isInteger);
      const semantic = meta?.semanticType;
      rank = 1;

      if (
        semantic === ColumnSemanticType.Percentage01 ||
        semantic === ColumnSemanticType.Percentage0100
      ) {
        displayFormat = ColumnDisplayFormat.Percentage;
      } else if (!semantic && min >= 0 && max <= 1 && !allIntegers) {
        // Shares stored as fractions: record the type so bars read 0.79 as 79%
        displayFormat = ColumnDisplayFormat.Percentage;
        metadataPatches.push({
          column: name,
          semanticType: ColumnSemanticType.Percentage01,
        });
      } else if (
        !semantic &&
        PERCENT_NAME.test(name) &&
        min >= 0 &&
        max <= 100
      ) {
        displayFormat = ColumnDisplayFormat.Percentage;
        metadataPatches.push({
          column: name,
          semanticType: ColumnSemanticType.Percentage0100,
        });
      } else if (
        allIntegers &&
        min >= 0 &&
        max >= 2 &&
        max <= 10 &&
        SCALE_NAME.test(name)
      ) {
        displayFormat = ColumnDisplayFormat.Scale;
        scaleMax = /decile/i.test(name) ? 10 : /quintile/i.test(name) ? 5 : max;
      } else {
        displayFormat = ColumnDisplayFormat.Number;
      }
    } else {
      const averageLength =
        strings.reduce((sum, v) => sum + v.length, 0) /
        Math.max(1, strings.length);
      if (averageLength > LARGE_TEXT_LENGTH) {
        displayFormat = ColumnDisplayFormat.LargeText;
        rank = 3;
      }
    }

    // Party columns take the party's colour ("Smart match")
    const hasBar =
      displayFormat === ColumnDisplayFormat.Percentage ||
      displayFormat === ColumnDisplayFormat.Scale;
    const barColor =
      hasBar && isPartyColumn(name, meta?.displayName)
        ? SMART_MATCH_BAR_COLOR_VALUE
        : undefined;

    kept.push({
      item: {
        type: "column",
        name,
        displayFormat,
        ...(scaleMax ? { scaleMax } : {}),
        ...(barColor ? { barColor } : {}),
        // Columns on the map lead as key figures; unpin them in the editor
        ...(isPriority ? { pinned: true } : {}),
      },
      rank: isPriority ? -1 + priorityColumns.indexOf(name) / 1000 : rank,
    });
    // Stable within a rank: keep the source's column order
    kept[kept.length - 1].rank += index / 1e6;
  });

  const sorted = kept.sort((a, b) => a.rank - b.rank).map((k) => k.item);

  // Three or more party shares read best as one ranking: they go last, under
  // a bar chart divider, and aren't pinned (the chart shows them all)
  const isPartyShare = (item: ColumnItem) =>
    item.barColor === SMART_MATCH_BAR_COLOR_VALUE &&
    item.displayFormat === ColumnDisplayFormat.Percentage;
  const parties = sorted.filter(isPartyShare);
  const charted = parties.length >= 3;
  const items = charted
    ? [
        ...sorted.filter((item) => !isPartyShare(item)),
        ...parties.map((item) => ({ ...item, pinned: undefined })),
      ]
    : sorted;
  const layoutItems: InspectorItem[] = charted
    ? [
        ...items.slice(0, items.length - parties.length),
        {
          type: "divider",
          id: uuidv4(),
          label: "Vote share",
          display: "barChart",
        },
        ...items.slice(items.length - parties.length),
        // Closes the chart, so columns added later show as rows
        { type: "divider", id: uuidv4(), label: "", display: "chartEnd" },
      ]
    : items;
  const shortItems = items.filter(
    (i) =>
      i.displayFormat !== ColumnDisplayFormat.LargeText &&
      !(charted && isPartyShare(i)),
  );

  return {
    items,
    layoutItems,
    chartedColumns: charted ? parties.length : 0,
    layout: shortItems.length > 4 ? "twoColumn" : "single",
    metadataPatches,
    hidden,
  };
};
