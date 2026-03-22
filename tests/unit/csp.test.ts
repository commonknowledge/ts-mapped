import { describe, expect, test } from "vitest";
import { buildCsp } from "@/csp";

describe("buildCsp", () => {
  describe("frame-ancestors", () => {
    test("sets frame-ancestors to the given value", () => {
      expect(buildCsp({ frameAncestors: "'self'", isProd: false })).toContain(
        "frame-ancestors 'self'",
      );
      expect(buildCsp({ frameAncestors: "*", isProd: false })).toContain(
        "frame-ancestors *",
      );
    });
  });

  describe("HSTS / WebSocket directives", () => {
    test("includes WebSocket origins in connect-src in dev", () => {
      const csp = buildCsp({ frameAncestors: "'self'", isProd: false });
      expect(csp).toContain("ws://localhost:*");
      expect(csp).toContain("wss://localhost:*");
    });

    test("excludes WebSocket origins from connect-src in prod", () => {
      const csp = buildCsp({ frameAncestors: "'self'", isProd: true });
      expect(csp).not.toContain("ws://localhost:*");
      expect(csp).not.toContain("wss://localhost:*");
    });
  });

  describe("minioDomain", () => {
    test("includes minioDomain in img-src and connect-src when provided", () => {
      const csp = buildCsp({
        frameAncestors: "'self'",
        isProd: false,
        minioDomain: "minio.example.com",
      });
      const directives = Object.fromEntries(
        csp.split("; ").map((d) => [d.split(" ")[0], d]),
      );
      expect(directives["img-src"]).toContain("https://minio.example.com");
      expect(directives["connect-src"]).toContain("https://minio.example.com");
    });

    test("omits minioDomain entries when not provided", () => {
      const csp = buildCsp({ frameAncestors: "'self'", isProd: false });
      expect(csp).not.toContain("minio.example.com");
    });
  });

  describe("required directives", () => {
    test("always includes expected directives", () => {
      const csp = buildCsp({ frameAncestors: "'self'", isProd: true });
      const directiveNames = csp.split("; ").map((d) => d.split(" ")[0]);
      for (const name of [
        "default-src",
        "script-src",
        "style-src",
        "font-src",
        "img-src",
        "connect-src",
        "frame-src",
        "media-src",
        "worker-src",
        "frame-ancestors",
      ]) {
        expect(directiveNames).toContain(name);
      }
    });

    test("does not emit duplicate directive names", () => {
      const csp = buildCsp({
        frameAncestors: "*",
        isProd: false,
        minioDomain: "minio.example.com",
      });
      const names = csp.split("; ").map((d) => d.split(" ")[0]);
      expect(names).toEqual([...new Set(names)]);
    });
  });
});
