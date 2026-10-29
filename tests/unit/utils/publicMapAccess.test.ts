import { describe, expect, test } from "vitest";
import {
  buildPublicMapAccessLink,
  findEmbedUrl,
} from "@/utils/publicMapAccess";

const EMBED_URLS = [
  "https://partner.example.org/map",
  "https://other.example.net/resources/map/",
];

describe("findEmbedUrl", () => {
  test("matches a configured page, ignoring query, fragment and trailing slash", () => {
    expect(
      findEmbedUrl({
        embedUrls: EMBED_URLS,
        pageUrl: "https://other.example.net/resources/map?utm=x#top",
      }),
    ).toBe("https://other.example.net/resources/map/");
  });

  test("returns the configured URL, not the visitor-supplied one", () => {
    expect(
      findEmbedUrl({
        embedUrls: EMBED_URLS,
        pageUrl: "https://partner.example.org/map/?evil=1",
      }),
    ).toBe("https://partner.example.org/map");
  });

  test("rejects other pages on a configured site", () => {
    expect(
      findEmbedUrl({
        embedUrls: EMBED_URLS,
        pageUrl: "https://partner.example.org/elsewhere",
      }),
    ).toBeNull();
  });

  test("rejects a lookalike origin", () => {
    expect(
      findEmbedUrl({
        embedUrls: EMBED_URLS,
        pageUrl: "https://partner.example.org.evil.com/map",
      }),
    ).toBeNull();
  });

  test("rejects missing and malformed URLs", () => {
    expect(findEmbedUrl({ embedUrls: EMBED_URLS, pageUrl: null })).toBeNull();
    expect(
      findEmbedUrl({ embedUrls: EMBED_URLS, pageUrl: "not a url" }),
    ).toBeNull();
  });
});

describe("buildPublicMapAccessLink", () => {
  test("links back to the page the request came from", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3000",
      embedUrls: EMBED_URLS,
      requestedFromUrl: "https://other.example.net/resources/map/",
      token: "abc",
    });
    expect(link).toBe(
      "https://other.example.net/resources/map/?mapped_access=abc",
    );
  });

  test("falls back to the first embed page when the request page is no longer configured", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3000",
      embedUrls: EMBED_URLS,
      requestedFromUrl: "https://removed.example.org/map",
      token: "abc",
    });
    expect(link).toBe("https://partner.example.org/map?mapped_access=abc");
  });

  test("keeps an embed page's own query string", () => {
    const link = buildPublicMapAccessLink({
      host: null,
      embedUrls: ["https://partner.example.org/?page_id=12"],
      requestedFromUrl: null,
      token: "abc",
    });
    expect(link).toBe(
      "https://partner.example.org/?page_id=12&mapped_access=abc",
    );
  });

  test("falls back to the map's own subdomain when no embed pages are configured", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3000",
      embedUrls: [],
      requestedFromUrl: null,
      token: "abc",
    });
    expect(new URL(link).host).toBe("praxis.localhost:3000");
    expect(new URL(link).searchParams.get("mapped_access")).toBe("abc");
  });
});
