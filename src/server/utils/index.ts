import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Batch an array of items into an array of arrays
 * of length `batchSize`.
 */
export const batch = <T>(records: T[], batchSize: number) => {
  const batches = [];
  let batch = [];
  for (const record of records) {
    batch.push(record);
    if (batch.length === batchSize) {
      batches.push(batch);
      batch = [];
    }
  }
  if (batch.length) {
    batches.push(batch);
  }
  return batches;
};

/**
 * Convert an AsyncGenerator that returns one record
 * at a time to one that returns arrays of length
 * `batchSize`.
 */
export const batchAsync = async function* <T>(
  records: AsyncGenerator<T, unknown, unknown>,
  batchSize: number,
) {
  let batch = [];
  for await (const record of records) {
    batch.push(record);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) {
    yield batch;
  }
};

/**
 * Return the absolute path to the project root directory
 * (containing bin, src, public, resources, etc).
 */
export const getBaseDir = () => {
  return dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
};
