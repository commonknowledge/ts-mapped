import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Return the absolute path to the project root directory
 * (containing bin, src, public, resources, etc.)
 */
export const getBaseDir = () => {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))));
};
