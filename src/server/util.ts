import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Return the absolute path to the project root directory
 * (containing bin, src, public, resources, etc.)
 */
export const getBaseDir = () => {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))));
};

export const getErrorMessage = (e: unknown) => {
  if (e && typeof e === "object" && "message" in e && e.message) {
    return e.message;
  }
  const message = String(e);
  if (message !== "[object Object]") {
    return message;
  }
  return "Unknown error";
};
