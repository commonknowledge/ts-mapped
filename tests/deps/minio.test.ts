import * as Minio from "minio";
import { describe, expect, test } from "vitest";

/**
 * minio as used in src/server/services/minio.ts: construct a client from
 * endpoint/port/SSL/keys and call putObject / removeObject. Shape only; no
 * network. (Also the package that carries the unfixable stream-json and
 * query-string audit findings, which only matter for bucket notifications.)
 */
describe("minio", () => {
  test("client constructs and exposes the two methods we call", () => {
    const client = new Minio.Client({
      endPoint: "minio.example.com",
      port: 443,
      useSSL: true,
      accessKey: "access",
      secretKey: "secret",
    });
    expect(client.putObject).toBeTypeOf("function");
    expect(client.removeObject).toBeTypeOf("function");
  });
});
