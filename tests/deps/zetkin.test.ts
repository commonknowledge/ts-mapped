import { describe, expect, test } from "vitest";
import Z from "zetkin";

/**
 * zetkin SDK as used in src/server/adaptors/zetkin.ts: Z.construct(), then
 * configure / setTokenData / getTokenData / refresh. Shape only; no network.
 */
describe("zetkin", () => {
  test("construct returns a client with the methods the adaptor calls", () => {
    const z = Z.construct();
    expect(z.configure).toBeTypeOf("function");
    expect(z.setTokenData).toBeTypeOf("function");
    expect(z.getTokenData).toBeTypeOf("function");
    expect(z.refresh).toBeTypeOf("function");
    z.configure({ clientId: "id", clientSecret: "secret", scopes: ["level2"] });
    z.setTokenData({ access_token: "x" });
    expect(z.getTokenData()).toMatchObject({ access_token: "x" });
  });
});
