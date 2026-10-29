import { DEV_NEXT_PUBLIC_BASE_URL, DEV_PUBLIC_MAP_BASE_URL } from "@/constants";
import { trimLeadingSlashes, trimTrailingSlashes } from "./text";

export const getAbsoluteUrl = (path = "/") => {
  const base = process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL;
  return `${trimTrailingSlashes(base)}/${trimLeadingSlashes(path)}`;
};

/**
 * The base URL public map subdomains hang off: a map's host is
 * `<subdomain>.<this URL's host>`. Differs from the app URL only in dev.
 */
export const getPublicMapBaseUrl = () =>
  new URL(process.env.NEXT_PUBLIC_BASE_URL || DEV_PUBLIC_MAP_BASE_URL);

/** The address of a public map with this host. */
export const getPublicMapUrl = (host: string) =>
  `${getPublicMapBaseUrl().protocol}//${host}/`;
