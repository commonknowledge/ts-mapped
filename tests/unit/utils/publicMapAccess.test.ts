import { describe, expect, test } from "vitest";
import {
  buildPublicMapAccessLink,
  getEmbedContext,
  toOrigin,
} from "@/utils/publicMapAccess";

const EMBED_ORIGINS = [
  "https://partner.example.org",
  "https://other.example.net",
];

describe("toOrigin", () => {
  test("keeps only the website part of an address", () => {
    expect(toOrigin("https://partner.example.org/map/?a=1#top")).toBe(
      "https://partner.example.org",
    );
    expect(toOrigin("http://localhost:8080/")).toBe("http://localhost:8080");
  });

  test("rejects anything that isn't an http(s) address", () => {
    expect(toOrigin("partner.example.org")).toBeNull();
    expect(toOrigin("javascript:alert(1)")).toBeNull();
    expect(toOrigin("ftp://partner.example.org")).toBeNull();
  });
});

describe("getEmbedContext", () => {
  test("no embedding page means the map's own address", () => {
    expect(
      getEmbedContext({ embedOrigins: EMBED_ORIGINS, pageUrl: null }),
    ).toEqual({ kind: "direct" });
  });

  test("any page on a listed website is allowed, and kept exactly", () => {
    expect(
      getEmbedContext({
        embedOrigins: EMBED_ORIGINS,
        pageUrl: "https://other.example.net/resources/map?page_id=12#top",
      }),
    ).toEqual({
      kind: "embedded",
      pageUrl: "https://other.example.net/resources/map?page_id=12",
    });
  });

  test("a stale token on the page is dropped", () => {
    expect(
      getEmbedContext({
        embedOrigins: EMBED_ORIGINS,
        pageUrl: "https://partner.example.org/map?mapped_access=old",
      }),
    ).toEqual({ kind: "embedded", pageUrl: "https://partner.example.org/map" });
  });

  test("an unlisted website is reported with its origin", () => {
    expect(
      getEmbedContext({
        embedOrigins: EMBED_ORIGINS,
        pageUrl: "https://elsewhere.example.com/map",
      }),
    ).toEqual({ kind: "unlisted", origin: "https://elsewhere.example.com" });
  });

  test("lookalike origins and other protocols or ports are unlisted", () => {
    for (const pageUrl of [
      "https://partner.example.org.evil.com/map",
      "http://partner.example.org/map",
      "https://partner.example.org:8443/map",
      "https://sub.partner.example.org/map",
    ]) {
      expect(
        getEmbedContext({ embedOrigins: EMBED_ORIGINS, pageUrl }).kind,
      ).toBe("unlisted");
    }
  });

  test("a malformed page address is unlisted", () => {
    expect(
      getEmbedContext({ embedOrigins: EMBED_ORIGINS, pageUrl: "not a url" }),
    ).toEqual({ kind: "unlisted", origin: null });
  });
});

describe("buildPublicMapAccessLink", () => {
  test("links back to the page the request came from, naming the map", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3001",
      embedOrigins: EMBED_ORIGINS,
      requestedFromUrl: "https://other.example.net/resources/map?page_id=12",
      token: "abc",
    });
    expect(link).toBe(
      "https://other.example.net/resources/map?page_id=12&mapped_access=abc&mapped_map=praxis.localhost%3A3001",
    );
  });

  test("a page from an older link doesn't keep its map parameter", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3001",
      embedOrigins: EMBED_ORIGINS,
      requestedFromUrl:
        "https://other.example.net/map?mapped_access=old&mapped_map=other.localhost%3A3001",
      token: "abc",
    });
    expect(new URL(link ?? "").searchParams.getAll("mapped_map")).toEqual([
      "praxis.localhost:3001",
    ]);
  });

  test("a request from the map's own address links back there", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3001",
      embedOrigins: EMBED_ORIGINS,
      requestedFromUrl: null,
      token: "abc",
    });
    expect(new URL(link ?? "").host).toBe("praxis.localhost:3001");
    expect(new URL(link ?? "").searchParams.get("mapped_access")).toBe("abc");
  });

  test("a page whose website has since been removed links to the map's own address", () => {
    const link = buildPublicMapAccessLink({
      host: "praxis.localhost:3001",
      embedOrigins: ["https://other.example.net"],
      requestedFromUrl: "https://partner.example.org/map",
      token: "abc",
    });
    expect(new URL(link ?? "").host).toBe("praxis.localhost:3001");
  });

  test("no link when the map has no address", () => {
    expect(
      buildPublicMapAccessLink({
        host: null,
        embedOrigins: [],
        requestedFromUrl: "https://partner.example.org/map",
        token: "abc",
      }),
    ).toBeNull();
  });
});
