import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
  JobStatus,
} from "@/models/DataSource";
import { MarkerDisplayMode } from "@/models/Map";
import { FilterType, MapStyleName } from "@/models/MapView";
import { CalculationType } from "@/models/shared";
import copyMapsToOrganisation from "@/server/commands/copyMapsToOrganisation";
import {
  createDataSource,
  deleteDataSource,
  findDataSourceById,
  getJobInfo,
} from "@/server/repositories/DataSource";
import {
  createMap,
  deleteMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
import {
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import type { Map } from "@/models/Map";
import type { MapView } from "@/models/MapView";

const cleanup = {
  dataSourceIds: [] as string[],
  mapIds: [] as string[],
};

async function createTestDataSource(organisationId: string, name: string) {
  const ds = await createDataSource({
    name,
    organisationId,
    autoEnrich: false,
    autoImport: false,
    config: {
      type: DataSourceType.CSV,
      url: `file://tests/resources/stats.csv?${uuidv4()}`,
    },
    columnDefs: [],
    columnMetadata: [],
    columnRoles: { nameColumns: ["Name"] },
    enrichments: [],
    geocodingConfig: { type: GeocodingType.None },
    public: false,
    recordType: DataSourceRecordType.Data,
  });
  cleanup.dataSourceIds.push(ds.id);
  return ds;
}

async function createTestOrg(name: string) {
  return upsertOrganisation({ name });
}

async function createTestMap(organisationId: string, name: string) {
  const map = await createMap(organisationId, name);
  cleanup.mapIds.push(map.id);
  return map;
}

describe("copyMapsToOrganisation", () => {
  describe("with included and excluded data sources", () => {
    let sourceOrg: Awaited<ReturnType<typeof createTestOrg>>;
    let targetOrg: Awaited<ReturnType<typeof createTestOrg>>;
    let includedDs: Awaited<ReturnType<typeof createTestDataSource>>;
    let excludedDs: Awaited<ReturnType<typeof createTestDataSource>>;
    let membersDs: Awaited<ReturnType<typeof createTestDataSource>>;
    let sourceMap: Awaited<ReturnType<typeof createTestMap>>;
    let copiedMap: Map;
    let copiedViews: MapView[];

    beforeAll(async () => {
      sourceOrg = await createTestOrg(`Source Org ${uuidv4()}`);
      targetOrg = await createTestOrg(`Target Org ${uuidv4()}`);

      includedDs = await createTestDataSource(sourceOrg.id, "Included DS");
      excludedDs = await createTestDataSource(sourceOrg.id, "Excluded DS");
      membersDs = await createTestDataSource(sourceOrg.id, "Members DS");

      sourceMap = await createTestMap(sourceOrg.id, "Test Map");
      await updateMap(sourceMap.id, {
        config: {
          markerDataSourceIds: [includedDs.id, excludedDs.id],
          membersDataSourceId: membersDs.id,
          markerColors: {
            [includedDs.id]: "#ff0000",
            [excludedDs.id]: "#00ff00",
          },
          markerDisplayModes: {
            [includedDs.id]: MarkerDisplayMode.Clusters,
            [excludedDs.id]: MarkerDisplayMode.Heatmap,
          },
        },
      });

      // View referencing the included DS as areaDataSource, with both DS in dataSourceViews
      await upsertMapView({
        mapId: sourceMap.id,
        name: "Included View",
        position: 0,
        config: {
          areaDataSourceId: includedDs.id,
          areaDataColumn: "Lab %",
          mapStyleName: MapStyleName.Light,
          showBoundaryOutline: true,
          showLabels: true,
          showLocations: true,
          showMembers: true,
          showTurf: true,
          calculationType: CalculationType.Avg,
        },
        dataSourceViews: [
          {
            dataSourceId: includedDs.id,
            filter: { type: FilterType.MULTI },
            search: "",
            sort: [],
          },
          {
            dataSourceId: excludedDs.id,
            filter: { type: FilterType.MULTI },
            search: "",
            sort: [],
          },
        ],
      });

      // View referencing only the excluded DS
      await upsertMapView({
        mapId: sourceMap.id,
        name: "Excluded View",
        position: 1,
        config: {
          areaDataSourceId: excludedDs.id,
          areaDataColumn: "Con %",
          mapStyleName: MapStyleName.Light,
          showBoundaryOutline: true,
          showLabels: true,
          showLocations: true,
          showMembers: true,
          showTurf: true,
          calculationType: CalculationType.Avg,
        },
        dataSourceViews: [],
      });

      // Run the copy — include only includedDs and membersDs
      await copyMapsToOrganisation(
        [
          {
            mapId: sourceMap.id,
            dataSourceIds: [includedDs.id, membersDs.id],
          },
        ],
        targetOrg.id,
      );

      const targetMaps = await findMapsByOrganisationId(targetOrg.id);
      copiedMap = targetMaps[0];
      cleanup.mapIds.push(copiedMap.id);

      // Track copied data source IDs for cleanup
      for (const dsId of copiedMap.config.markerDataSourceIds) {
        cleanup.dataSourceIds.push(dsId);
      }
      if (copiedMap.config.membersDataSourceId) {
        cleanup.dataSourceIds.push(copiedMap.config.membersDataSourceId);
      }

      copiedViews = await findMapViewsByMapId(copiedMap.id);
    });

    test("creates exactly one map in the target org", async () => {
      const targetMaps = await findMapsByOrganisationId(targetOrg.id);
      expect(targetMaps.length).toBe(1);
      expect(targetMaps[0].name).toBe("Test Map");
    });

    test("copies included data sources to target org", async () => {
      for (const dsId of copiedMap.config.markerDataSourceIds) {
        const ds = await findDataSourceById(dsId);
        expect(ds?.organisationId).toBe(targetOrg.id);
      }
      if (copiedMap.config.membersDataSourceId) {
        const ds = await findDataSourceById(
          copiedMap.config.membersDataSourceId,
        );
        expect(ds?.organisationId).toBe(targetOrg.id);
      }
    });

    test("only includes the selected marker data source (not the excluded one)", () => {
      expect(copiedMap.config.markerDataSourceIds.length).toBe(1);
    });

    test("does not reference any original data source IDs anywhere in copied map", () => {
      const originalDsIds = [includedDs.id, excludedDs.id, membersDs.id];

      // Map config
      for (const originalId of originalDsIds) {
        expect(copiedMap.config.markerDataSourceIds).not.toContain(originalId);
        expect(copiedMap.config.membersDataSourceId).not.toBe(originalId);
      }

      // Config keyed records
      if (copiedMap.config.markerColors) {
        for (const originalId of originalDsIds) {
          expect(copiedMap.config.markerColors).not.toHaveProperty(originalId);
        }
      }
      if (copiedMap.config.markerDisplayModes) {
        for (const originalId of originalDsIds) {
          expect(copiedMap.config.markerDisplayModes).not.toHaveProperty(
            originalId,
          );
        }
      }

      // Views
      for (const view of copiedViews) {
        expect(originalDsIds).not.toContain(view.config.areaDataSourceId);
        for (const dsv of view.dataSourceViews) {
          expect(originalDsIds).not.toContain(dsv.dataSourceId);
        }
      }
    });

    test("remaps markerColors only for included data sources", () => {
      const markerColors = copiedMap.config.markerColors;
      expect(markerColors).toBeDefined();
      if (!markerColors) return;

      const colorKeys = Object.keys(markerColors);
      expect(colorKeys.length).toBe(1);

      const copiedIncludedDsId = copiedMap.config.markerDataSourceIds[0];
      expect(markerColors[copiedIncludedDsId]).toBe("#ff0000");
    });

    test("remaps markerDisplayModes only for included data sources", () => {
      const displayModes = copiedMap.config.markerDisplayModes;
      expect(displayModes).toBeDefined();
      if (!displayModes) return;

      const modeKeys = Object.keys(displayModes);
      expect(modeKeys.length).toBe(1);
    });

    test("drops views whose areaDataSourceId was not included", () => {
      // Source had 2 views; only the one referencing includedDs should be copied
      expect(copiedViews.length).toBe(1);
      expect(copiedViews[0].name).toBe("Included View");
    });

    test("strips excluded data source views from copied views", () => {
      const view = copiedViews[0];
      // Original had 2 dataSourceViews (included + excluded); copy should have 1
      expect(view.dataSourceViews.length).toBe(1);
      expect(view.dataSourceViews[0].dataSourceId).not.toBe(includedDs.id);
      expect(view.dataSourceViews[0].dataSourceId).not.toBe(excludedDs.id);
    });

    test("enqueues an importDataSource job for each copied data source", async () => {
      const copiedDsIds = [...copiedMap.config.markerDataSourceIds];
      if (copiedMap.config.membersDataSourceId) {
        copiedDsIds.push(copiedMap.config.membersDataSourceId);
      }
      expect(copiedDsIds.length).toBeGreaterThan(0);
      for (const dsId of copiedDsIds) {
        const jobInfo = await getJobInfo(dsId, "importDataSource");
        expect(jobInfo.status).not.toBe(JobStatus.None);
      }
    });

    test("remaining data source view references a data source in the target org", async () => {
      const ds = await findDataSourceById(
        copiedViews[0].dataSourceViews[0].dataSourceId,
      );
      expect(ds?.organisationId).toBe(targetOrg.id);
    });
  });

  describe("with members DS excluded", () => {
    test("sets membersDataSourceId to null", async () => {
      const sourceOrg = await createTestOrg(`MembersExcl Source ${uuidv4()}`);
      const targetOrg = await createTestOrg(`MembersExcl Target ${uuidv4()}`);

      const includedDs = await createTestDataSource(sourceOrg.id, "Marker DS");
      const membersDs = await createTestDataSource(sourceOrg.id, "Members DS");

      const sourceMap = await createTestMap(sourceOrg.id, "Map With Members");
      await updateMap(sourceMap.id, {
        config: {
          markerDataSourceIds: [includedDs.id],
          membersDataSourceId: membersDs.id,
        },
      });

      // Copy with only the marker DS, not the members DS
      await copyMapsToOrganisation(
        [{ mapId: sourceMap.id, dataSourceIds: [includedDs.id] }],
        targetOrg.id,
      );

      const targetMaps = await findMapsByOrganisationId(targetOrg.id);
      expect(targetMaps.length).toBe(1);
      cleanup.mapIds.push(targetMaps[0].id);

      expect(targetMaps[0].config.membersDataSourceId).toBeNull();
      expect(targetMaps[0].config.markerDataSourceIds.length).toBe(1);

      for (const dsId of targetMaps[0].config.markerDataSourceIds) {
        cleanup.dataSourceIds.push(dsId);
      }
    });
  });

  describe("with empty dataSourceIds", () => {
    test("copies map with no data sources and no views", async () => {
      const sourceOrg = await createTestOrg(`Empty Source ${uuidv4()}`);
      const targetOrg = await createTestOrg(`Empty Target ${uuidv4()}`);

      const ds = await createTestDataSource(sourceOrg.id, "Some DS");
      const sourceMap = await createTestMap(sourceOrg.id, "Map Empty Copy");
      await updateMap(sourceMap.id, {
        config: {
          markerDataSourceIds: [ds.id],
          membersDataSourceId: null,
        },
      });

      await upsertMapView({
        mapId: sourceMap.id,
        name: "View",
        position: 0,
        config: {
          areaDataSourceId: ds.id,
          areaDataColumn: "Lab %",
          mapStyleName: MapStyleName.Light,
          showBoundaryOutline: true,
          showLabels: true,
          showLocations: true,
          showMembers: true,
          showTurf: true,
          calculationType: CalculationType.Avg,
        },
        dataSourceViews: [],
      });

      await copyMapsToOrganisation(
        [{ mapId: sourceMap.id, dataSourceIds: [] }],
        targetOrg.id,
      );

      const targetMaps = await findMapsByOrganisationId(targetOrg.id);
      expect(targetMaps.length).toBe(1);
      cleanup.mapIds.push(targetMaps[0].id);

      expect(targetMaps[0].config.markerDataSourceIds).toEqual([]);
      expect(targetMaps[0].config.membersDataSourceId).toBeNull();

      const views = await findMapViewsByMapId(targetMaps[0].id);
      expect(views.length).toBe(0);
    });
  });

  describe("with non-existent IDs", () => {
    test("skips non-existent maps gracefully", async () => {
      const targetOrg = await createTestOrg(`FakeMap Target ${uuidv4()}`);

      await copyMapsToOrganisation(
        [{ mapId: uuidv4(), dataSourceIds: ["fake-ds-id"] }],
        targetOrg.id,
      );

      const targetMaps = await findMapsByOrganisationId(targetOrg.id);
      expect(targetMaps.length).toBe(0);
    });

    test("skips non-existent data sources gracefully", async () => {
      const sourceOrg = await createTestOrg(`FakeDS Source ${uuidv4()}`);
      const targetOrg = await createTestOrg(`FakeDS Target ${uuidv4()}`);

      const sourceMap = await createTestMap(sourceOrg.id, "Map Fake DS");

      await copyMapsToOrganisation(
        [{ mapId: sourceMap.id, dataSourceIds: [uuidv4()] }],
        targetOrg.id,
      );

      const targetMaps = await findMapsByOrganisationId(targetOrg.id);
      expect(targetMaps.length).toBe(1);
      cleanup.mapIds.push(targetMaps[0].id);

      expect(targetMaps[0].config.markerDataSourceIds).toEqual([]);
      expect(targetMaps[0].config.membersDataSourceId).toBeNull();
    });
  });

  afterAll(async () => {
    for (const id of cleanup.mapIds) {
      try {
        await deleteMap(id);
      } catch {
        // already deleted
      }
    }
    for (const id of cleanup.dataSourceIds) {
      try {
        await deleteDataSource(id);
      } catch {
        // already deleted
      }
    }
  });
});
