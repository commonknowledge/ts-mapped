export const MARKER_ID_KEY = "__externalId";
export const MARKER_NAME_KEY = "__name";

export const MAX_COLUMN_KEY = "__maxColumn";

export const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export const DATA_SOURCE_JOB_BATCH_SIZE = 100;

// This is smaller than the external data source
// maximum page size (e.g. Airtable = 100) to simplify
// importDataRecords / enrichDataRecords code (no pagination)
export const DATA_RECORDS_JOB_BATCH_SIZE = 10;
