import { PUBLIC_MAP_ACCESS_TOKEN_PARAM } from "@/constants";
import { getPublicMapBaseUrl, getPublicMapUrl } from "./appUrl";

// Compare pages ignoring query string, fragment and a trailing slash
const pageKey = (url: URL) =>
  `${url.origin}${url.pathname.replace(/\/+$/, "")}`;

const parseUrl = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/**
 * The configured embed page that `pageUrl` is on, or null if it is not one
 * of them. Returns the *configured* URL rather than the visitor-supplied
 * one, so nothing from the request ends up in a magic link.
 */
export function findEmbedUrl({
  embedUrls,
  pageUrl,
}: {
  embedUrls: string[];
  pageUrl: string | null | undefined;
}): string | null {
  const page = parseUrl(pageUrl);
  if (!page) {
    return null;
  }
  for (const embedUrl of embedUrls) {
    const embed = parseUrl(embedUrl);
    if (embed && pageKey(embed) === pageKey(page)) {
      return embedUrl;
    }
  }
  return null;
}

/**
 * Where a magic link points: the embed page the request came from if it is
 * still configured, else the first configured embed page, else the map's
 * own subdomain. The token is added as a query parameter.
 */
export function buildPublicMapAccessLink({
  host,
  embedUrls,
  requestedFromUrl,
  token,
}: {
  host: string | null;
  embedUrls: string[];
  requestedFromUrl: string | null;
  token: string;
}): string {
  const base =
    findEmbedUrl({ embedUrls, pageUrl: requestedFromUrl }) ??
    embedUrls[0] ??
    getPublicMapUrl(host ?? getPublicMapBaseUrl().host);
  const url = new URL(base);
  url.searchParams.set(PUBLIC_MAP_ACCESS_TOKEN_PARAM, token);
  return url.toString();
}
