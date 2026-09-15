import { describe, expect, test } from "vitest";
import { ZodError, z } from "zod";
import { AreaSetCode, areaSetCode } from "@/models/AreaSet";
import { Feature, organisationSchema } from "@/models/Organisation";

/**
 * zod as used in src/models and src/server/trpc/index.ts. The tRPC error
 * formatter calls `error.cause.flatten()` on a ZodError, and the models lean
 * heavily on z.nativeEnum (37 uses). Both are deprecated in zod 4, so this is
 * the file to update when that bump lands.
 */
describe("zod", () => {
  test("z.nativeEnum accepts enum values and rejects others", () => {
    expect(areaSetCode.parse("PC")).toBe(AreaSetCode.PC);
    expect(areaSetCode.safeParse("NOPE").success).toBe(false);
  });

  test("model schema: trim, url, nullish, array default, date", () => {
    const parsed = organisationSchema.parse({
      id: "org-1",
      name: "  Common Knowledge  ",
      avatarUrl: null,
      createdAt: new Date("2026-01-01"),
    });
    expect(parsed.name).toBe("Common Knowledge");
    expect(parsed.features).toEqual([]);
    expect(parsed.avatarUrl).toBeNull();

    const withFeatures = organisationSchema.parse({
      id: "org-1",
      name: "x",
      features: [Feature.PublicMaps],
      createdAt: new Date(),
    });
    expect(withFeatures.features).toEqual([Feature.PublicMaps]);

    expect(
      organisationSchema.safeParse({
        id: "org-1",
        name: "x",
        avatarUrl: "nope",
      }).success,
    ).toBe(false);
  });

  test("ZodError.flatten() has the shape the tRPC errorFormatter sends", () => {
    const result = z
      .object({ name: z.string().min(1), count: z.number() })
      .safeParse({ name: "", count: "x" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeInstanceOf(ZodError);
    const flat = result.error.flatten();
    expect(flat.fieldErrors.name).toBeDefined();
    expect(flat.fieldErrors.count).toBeDefined();
    expect(flat.formErrors).toEqual([]);
  });

  test("schema.partial() and z.infer round trip", () => {
    const partial = organisationSchema.partial();
    // .partial() makes the .default([]) field optional, so it is omitted.
    expect(partial.parse({ name: "x" })).toEqual({ name: "x" });
    const value: z.infer<typeof organisationSchema> = {
      id: "1",
      name: "n",
      features: [],
      createdAt: new Date(),
    };
    expect(organisationSchema.parse(value)).toEqual(value);
  });
});
