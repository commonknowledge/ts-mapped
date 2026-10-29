import { PUBLIC_MAP_ACCESS_TOKEN_PARAM } from "@/constants";
import { getPublicMapUrl } from "./appUrl";

const parseHttpUrl = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

/**
 * The site part of a web address ("https://example.org/a/b" becomes
 * "https://example.org"), or null if it isn't an http(s) address.
 */
export function toOrigin(value: string): string | null {
  return parseHttpUrl(value)?.origin ?? null;
}

/**
 * Where a moderated map is being viewed from, judged by the embedding page
 * embed.js reported (absent when the map is opened at its own address):
 * - "direct": the map's own address
 * - "embedded": a page on one of the listed sites (`pageUrl` is that page)
 * - "unlisted": embedded on a site that is not listed. Access requests from
 *   here are refused, so magic links only ever go to listed sites.
 */
export type EmbedContext =
  | { kind: "direct" }
  | { kind: "embedded"; pageUrl: string }
  | { kind: "unlisted"; origin: string | null };

export function getEmbedContext({
  embedOrigins,
  pageUrl,
}: {
  embedOrigins: string[];
  pageUrl: string | null | undefined;
}): EmbedContext {
  if (!pageUrl) {
    return { kind: "direct" };
  }
  const page = parseHttpUrl(pageUrl);
  if (!page || !embedOrigins.includes(page.origin)) {
    return { kind: "unlisted", origin: page?.origin ?? null };
  }
  page.hash = "";
  page.searchParams.delete(PUBLIC_MAP_ACCESS_TOKEN_PARAM);
  return { kind: "embedded", pageUrl: page.toString() };
}

/**
 * Where a magic link points: back to the page the request came from, if its
 * site is still listed, else the map's own address. The token is added as a
 * query parameter. Null if there is nowhere to point: the site is no longer
 * listed and the map has no address of its own.
 */
export function buildPublicMapAccessLink({
  host,
  embedOrigins,
  requestedFromUrl,
  token,
}: {
  host: string | null;
  embedOrigins: string[];
  requestedFromUrl: string | null;
  token: string;
}): string | null {
  const context = getEmbedContext({ embedOrigins, pageUrl: requestedFromUrl });
  let base: string;
  if (context.kind === "embedded") {
    base = context.pageUrl;
  } else if (host) {
    base = getPublicMapUrl(host);
  } else {
    return null;
  }
  const url = new URL(base);
  url.searchParams.set(PUBLIC_MAP_ACCESS_TOKEN_PARAM, token);
  return url.toString();
}
