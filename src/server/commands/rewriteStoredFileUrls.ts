import { replaceStoredFileOrigin } from "@/server/repositories/StoredFileUrl";
import logger from "@/server/services/logger";

const parseOrigin = (value: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Not a URL: ${value}`);
  }
  const isPlainOrigin = url.origin === value.replace(/\/$/, "");
  if (url.protocol !== "https:" || !isPlainOrigin) {
    throw new Error(
      `Expected an https origin with no path, such as https://example.onrender.com: ${value}`,
    );
  }
  return url.origin;
};

/**
 * Points stored file URLs (map images, avatars, screenshots) at a new MinIO,
 * for when MinIO moves. Copy the buckets to the new MinIO first.
 *
 * Without `confirm` it only counts the URLs that would change. It can be run
 * again safely, for example to catch images uploaded during the switch.
 */
const rewriteStoredFileUrls = async ({
  from,
  to,
  confirm,
}: {
  from: string;
  to: string;
  confirm: boolean;
}) => {
  const fromOrigin = parseOrigin(from);
  const toOrigin = parseOrigin(to);
  if (fromOrigin === toOrigin) {
    throw new Error("--from and --to are the same");
  }

  const counts = await replaceStoredFileOrigin({
    from: fromOrigin,
    to: toOrigin,
    confirm,
  });
  const action = confirm ? "Rewrote" : "Would rewrite";
  let total = 0;
  for (const { column, count } of counts) {
    total += count;
    logger.info(`${action} ${count} URL(s) in ${column}`);
  }
  logger.info(`${action} ${total} URL(s) from ${fromOrigin} to ${toOrigin}`);
  if (!confirm) {
    logger.info("Dry run: nothing was changed. Run with --confirm to change.");
  }
};

export default rewriteStoredFileUrls;
