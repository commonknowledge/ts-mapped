import { describe, expect, it } from "vitest";
import { getPublicDataSourceIds } from "@/utils/map";
import type { MapConfig } from "@/models/Map";
import type { PublicMapDataSourceConfig } from "@/models/PublicMap";

const config = (dataSourceId: string) =>
  ({ dataSourceId }) as PublicMapDataSourceConfig;

const mapConfig = {
  membersDataSourceId: "members",
  markerDataSourceIds: ["a", "b"],
} as MapConfig;

describe("getPublicDataSourceIds", () => {
  it("follows the order of the public map data source configs", () => {
    expect(
      getPublicDataSourceIds(mapConfig, [
        config("b"),
        config("members"),
        config("a"),
      ]),
    ).toEqual(["b", "members", "a"]);
  });

  it("excludes data sources that are not markers on the private map", () => {
    expect(
      getPublicDataSourceIds(mapConfig, [config("other"), config("a")]),
    ).toEqual(["a"]);
  });

  it("excludes marker data sources that have no public config", () => {
    expect(getPublicDataSourceIds(mapConfig, [config("members")])).toEqual([
      "members",
    ]);
  });

  it("de-duplicates repeated configs", () => {
    expect(
      getPublicDataSourceIds(mapConfig, [config("a"), config("a")]),
    ).toEqual(["a"]);
  });
});
