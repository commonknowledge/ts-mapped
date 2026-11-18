import { afterAll, describe, expect, test } from "vitest";
import { MapAccessStatus } from "@/models/MapAccess";
import { createMap, deleteMap } from "@/server/repositories/Map";
import { findOrCreateMapAccess } from "@/server/repositories/MapAccess";
import {
  findMapShareById,
  findMapShareByMapId,
  findMapShareByToken,
  setMapShareEnabled,
  setMapShareModeratorEmails,
} from "@/server/repositories/MapShare";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";

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

  test("setting moderators creates a disabled share with an unguessable token", async () => {
    const share = await setMapShareModeratorEmails({
      mapId,
      moderatorEmails: ["moderator@example.org"],
    });
    expect(share.mapId).toBe(mapId);
    expect(share.enabled).toBe(false);
    expect(share.moderatorEmails).toEqual(["moderator@example.org"]);
    expect(share.token).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });

  test("share is findable by id, mapId and token", async () => {
    const byMapId = await findMapShareByMapId(mapId);
    expect(byMapId).toBeDefined();

    const byToken = await findMapShareByToken(byMapId?.token ?? "");
    expect(byToken?.id).toBe(byMapId?.id);

    const byId = await findMapShareById(byMapId?.id ?? "");
    expect(byId?.mapId).toBe(mapId);
  });

  test("setting moderators again keeps the same share, token and enabled state", async () => {
    const before = await findMapShareByMapId(mapId);
    await setMapShareEnabled({ mapId, enabled: true });

    const share = await setMapShareModeratorEmails({
      mapId,
      moderatorEmails: ["a@example.org", "b@example.org"],
    });
    expect(share.id).toBe(before?.id);
    expect(share.token).toBe(before?.token);
    expect(share.enabled).toBe(true);
    expect(share.moderatorEmails).toEqual(["a@example.org", "b@example.org"]);
  });

  test("disabling and re-enabling restores the same link", async () => {
    const disabled = await setMapShareEnabled({ mapId, enabled: false });
    expect(disabled?.enabled).toBe(false);

    const reEnabled = await setMapShareEnabled({ mapId, enabled: true });
    expect(reEnabled?.enabled).toBe(true);
    expect(reEnabled?.token).toBe(disabled?.token);
  });

  test("enabling a map with no share returns undefined", async () => {
    const otherMap = await createMap(orgId, "MapShare Test Map (no share)");
    try {
      const enabled = await setMapShareEnabled({
        mapId: otherMap.id,
        enabled: true,
      });
      expect(enabled).toBeUndefined();
    } finally {
      await deleteMap(otherMap.id);
    }
  });

  test("an access row is for exactly one of a public map and a share", async () => {
    const share = await findMapShareByMapId(mapId);
    await expect(
      db
        .insertInto("mapAccess")
        .values({
          publicMapId: null,
          mapShareId: null,
          email: "nobody@example.org",
          status: MapAccessStatus.Pending,
          requestedFromUrl: null,
          moderatorsNotifiedAt: null,
          decidedAt: null,
        })
        .execute(),
    ).rejects.toThrow();

    const { access } = await findOrCreateMapAccess({
      target: { kind: "mapShare", id: share?.id ?? "" },
      email: "Visitor@Example.org",
    });
    expect(access.mapShareId).toBe(share?.id);
    expect(access.publicMapId).toBeNull();
    expect(access.email).toBe("visitor@example.org");
  });

  test("deleting the map cascades to the share and its access rows", async () => {
    const before = await findMapShareByMapId(mapId);
    expect(before).toBeDefined();

    await deleteMap(mapId);
    mapId = "";

    const after = await findMapShareByMapId(before?.mapId ?? "");
    expect(after).toBeUndefined();

    const accessRows = await db
      .selectFrom("mapAccess")
      .where("mapShareId", "=", before?.id ?? "")
      .selectAll()
      .execute();
    expect(accessRows).toEqual([]);
  });
});
