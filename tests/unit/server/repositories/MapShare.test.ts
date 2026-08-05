import { afterAll, describe, expect, test } from "vitest";
import { createMap, deleteMap } from "@/server/repositories/Map";
import {
  findMapShareByMapId,
  findMapShareByToken,
  regenerateMapShareToken,
  setMapShareEnabled,
  setMapSharePassword,
  upsertMapShareForMap,
} from "@/server/repositories/MapShare";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { hashPassword, verifyPassword } from "@/server/utils/auth";

let orgId: string;
let mapId: string;

describe("MapShare repository", () => {
  afterAll(async () => {
    if (mapId) await deleteMap(mapId);
  });

  test("setup: create org and map", async () => {
    const org = await upsertOrganisation({ name: "MapShare Test Org" });
    orgId = org.id;

    const map = await createMap(orgId, "MapShare Test Map");
    mapId = map.id;
  });

  test("upsert creates a share with an unguessable token", async () => {
    const share = await upsertMapShareForMap(mapId);
    expect(share.mapId).toBe(mapId);
    expect(share.enabled).toBe(true);
    expect(share.passwordHash).toBeNull();
    expect(share.passwordUpdatedAt).toBeNull();
    expect(share.token).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });

  test("share is findable by mapId and by token", async () => {
    const byMapId = await findMapShareByMapId(mapId);
    expect(byMapId).toBeDefined();

    const byToken = await findMapShareByToken(byMapId?.token ?? "");
    expect(byToken?.id).toBe(byMapId?.id);
  });

  test("re-upserting keeps the same share and token", async () => {
    const before = await findMapShareByMapId(mapId);
    const share = await upsertMapShareForMap(mapId);
    expect(share.id).toBe(before?.id);
    expect(share.token).toBe(before?.token);
  });

  test("disabling and re-enabling restores the same link", async () => {
    const disabled = await setMapShareEnabled({ mapId, enabled: false });
    expect(disabled?.enabled).toBe(false);

    const reEnabled = await upsertMapShareForMap(mapId);
    expect(reEnabled.enabled).toBe(true);
    expect(reEnabled.token).toBe(disabled?.token);
  });

  test("setting a password stores a verifiable hash and bumps passwordUpdatedAt", async () => {
    const share = await setMapSharePassword({
      mapId,
      passwordHash: await hashPassword("correct horse battery staple"),
    });
    expect(share?.passwordHash).toBeDefined();
    expect(share?.passwordHash).not.toContain("correct horse");
    expect(share?.passwordUpdatedAt).toBeInstanceOf(Date);

    const valid = await verifyPassword(
      "correct horse battery staple",
      share?.passwordHash ?? "",
    );
    expect(valid).toBe(true);

    const invalid = await verifyPassword("wrong", share?.passwordHash ?? "");
    expect(invalid).toBe(false);
  });

  test("changing the password replaces the hash", async () => {
    const share = await setMapSharePassword({
      mapId,
      passwordHash: await hashPassword("new password"),
    });

    const oldPasswordValid = await verifyPassword(
      "correct horse battery staple",
      share?.passwordHash ?? "",
    );
    expect(oldPasswordValid).toBe(false);

    const newPasswordValid = await verifyPassword(
      "new password",
      share?.passwordHash ?? "",
    );
    expect(newPasswordValid).toBe(true);
  });

  test("removing the password clears the hash but keeps passwordUpdatedAt", async () => {
    const share = await setMapSharePassword({ mapId, passwordHash: null });
    expect(share?.passwordHash).toBeNull();
    expect(share?.passwordUpdatedAt).toBeInstanceOf(Date);
  });

  test("regenerating the token invalidates the old link", async () => {
    const before = await findMapShareByMapId(mapId);
    const share = await regenerateMapShareToken(mapId);

    expect(share?.token).toBeDefined();
    expect(share?.token).not.toBe(before?.token);
    expect(share?.token).toMatch(/^[A-Za-z0-9_-]{24}$/);

    const byOldToken = await findMapShareByToken(before?.token ?? "");
    expect(byOldToken).toBeUndefined();

    const byNewToken = await findMapShareByToken(share?.token ?? "");
    expect(byNewToken?.id).toBe(before?.id);
  });

  test("updates on a map with no share return undefined", async () => {
    const otherMap = await createMap(orgId, "MapShare Test Map (no share)");
    try {
      const enabled = await setMapShareEnabled({
        mapId: otherMap.id,
        enabled: true,
      });
      expect(enabled).toBeUndefined();

      const password = await setMapSharePassword({
        mapId: otherMap.id,
        passwordHash: await hashPassword("irrelevant"),
      });
      expect(password).toBeUndefined();

      const token = await regenerateMapShareToken(otherMap.id);
      expect(token).toBeUndefined();
    } finally {
      await deleteMap(otherMap.id);
    }
  });

  test("deleting the map cascades to the share", async () => {
    const before = await findMapShareByMapId(mapId);
    expect(before).toBeDefined();

    await deleteMap(mapId);
    mapId = "";

    const after = await findMapShareByMapId(before?.mapId ?? "");
    expect(after).toBeUndefined();
  });
});
