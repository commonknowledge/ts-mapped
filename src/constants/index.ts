export * from "./colors";

export const ADMIN_ORGANISATION_NAME = "Common Knowledge";

export const DATA_RECORDS_PAGE_SIZE = 100;

// Supported date formats (date-fns tokens) offered when configuring a date column.
export const DATE_FORMAT_OPTIONS = [
  { label: "ISO Format (YYYY-MM-DD)", value: "yyyy-MM-dd" },
  { label: "UK Format (DD/MM/YYYY)", value: "dd/MM/yyyy" },
  { label: "US Format (MM/DD/YYYY)", value: "MM/dd/yyyy" },
];

// Sort options offered when configuring how a public map listing is ordered.
export const SORT_BY_OPTIONS = [
  { label: "Record name", value: "name" },
  { label: "Record date", value: "date" },
];

export const SORT_DIRECTION_OPTIONS = [
  { label: "Ascending (A–Z / oldest first)", value: "asc" },
  { label: "Descending (Z–A / newest first)", value: "desc" },
];

export const DATA_SOURCE_JOB_BATCH_SIZE = 100;

// This is smaller than the external data source
// maximum page size (e.g. Airtable = 100) to simplify
// importDataRecords / enrichDataRecords code (no pagination)
export const DATA_RECORDS_JOB_BATCH_SIZE = 100;

export const DEFAULT_AUTH_REDIRECT = "/maps";

export const DEFAULT_TRIAL_PERIOD_DAYS = 30;

export const DEFAULT_ZOOM = 5;

export const DEFAULT_CUSTOM_COLOR = "#3b82f6";

export const DEV_NEXT_PUBLIC_BASE_URL = "https://localhost:3000";

export const DUMMY_COUNT_COLUMN = "__count";

export const ENRICHMENT_COLUMN_PREFIX = "Mapped: ";

// Free-text notes written back to the source system (e.g. Airtable) from
// the inspector, in a column created on demand like enrichment columns
export const NOTES_COLUMN = `${ENRICHMENT_COLUMN_PREFIX}Notes`;

export const GE_DATA_SOURCE_NAME = "2024 General Election Results";
// The column the election results open on: each seat's winning party
export const GE_DEFAULT_COLUMN = "First party";

export const JWT_LIFETIME_SECONDS = 24 * 60 * 60;

// Lifetime of a read-only map share grant (see ShareGrant in authTypes.ts)
export const SHARE_GRANT_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

// Different database derived column name because underscores get mangled by camelCase translation
export const MARKER_MATCHED_COLUMN = "mappedMatched";

export const MAX_COLUMN_KEY = "__maxColumn";

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MiB

export const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export const ORGANISATION_COOKIE_NAME = "MappedOrgId";

// Special sort columns
export const SORT_BY_LOCATION = "__location";

export const TRIAL_EXPIRED_MESSAGE = "Your trial has expired.";

// Boundary sets with too many areas to list in full when comparing a
// column across areas
export const AREA_RANKING_EXCLUDED_SETS: string[] = [
  "PC",
  "OA21",
  "LSOA21",
  "SOA22",
];

// How long a section takes to fold open or closed
export const COLLAPSE_DURATION_MS = 220;

// The map made for the light editor's guided tour: empty, so the tour can
// have you add the sample members and election results yourself
export const TUTORIAL_MAP_NAME = "Tutorial map";
export const TUTORIAL_MEMBERS_NAME = "Tutorial members";
