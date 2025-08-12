export const ADMIN_ORGANISATION_NAME = "Common Knowledge";

export const MARKER_ID_KEY = "__recordId";
export const MARKER_EXTERNAL_ID_KEY = "__externalId";
export const MARKER_NAME_KEY = "__name";
export const MARKER_MATCHED_KEY = "__matched";
export const MARKER_RADIUS_KEY = "__radius";
// Different database derived column name because underscores get mangled by camelCase translation
export const MARKER_MATCHED_COLUMN = "mappedMatched";

export const MAX_COLUMN_KEY = "__maxColumn";

export const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export const DATA_RECORDS_PAGE_SIZE = 100;

export const DATA_SOURCE_JOB_BATCH_SIZE = 100;

export const DEFAULT_ZOOM = 5;

// This is smaller than the external data source
// maximum page size (e.g. Airtable = 100) to simplify
// importDataRecords / enrichDataRecords code (no pagination)
export const DATA_RECORDS_JOB_BATCH_SIZE = 10;

export const DEV_NEXT_PUBLIC_BASE_URL = "https://localhost:3000";
