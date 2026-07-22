import logger from "../services/logger";

/**
 * Close a Kysely result stream, releasing its cursor, transaction and pooled
 * connection.
 *
 * A `for await` loop does this automatically when it breaks or throws, but a
 * manual `next()` loop does not: if it is abandoned part-way — most often when
 * an HTTP client disconnects mid-response and `controller.enqueue` throws —
 * the generator is never resumed and the transaction stays open for the
 * lifetime of the process, holding an ACCESS SHARE lock on the table. That
 * lock is enough to block any later `ALTER TABLE` indefinitely, and every
 * query queued behind it.
 *
 * Safe to call more than once, and never throws: releasing the connection
 * must not mask the error that caused the stream to end.
 */
export const closeRecordStream = async (
  stream: AsyncIterableIterator<unknown>,
): Promise<void> => {
  try {
    await stream.return?.(undefined);
  } catch (error) {
    logger.warn("Could not close data record stream", { error });
  }
};
