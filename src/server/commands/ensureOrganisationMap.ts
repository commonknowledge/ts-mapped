import { ADMIN_ORGANISATION_NAME } from "@/constants";
import importDataSource from "@/server/jobs/importDataSource";
import {
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import {
  createDataSource,
  findCSVDataSourceByUrlAndOrg,
} from "@/server/repositories/DataSource";
import {
  createMap,
  findMapsByOrganisationId,
  updateMap,
} from "@/server/repositories/Map";
import {
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { AreaSetCode, AreaSetGroupCode } from "../models/AreaSet";
import { ColorScheme, MapStyleName } from "../models/MapView";
import { countDataRecordsForDataSource } from "../repositories/DataRecord";
import type { MapView } from "../models/MapView";
import type { DataSource } from "@/server/models/DataSource";
import type { Map } from "@/server/models/Map";

const MAP_NAME = "Sample Map";
const GE_DATA_SOURCE_NAME = "2024 GE Results";
const MEMBERS_DATA_SOURCE_NAME = "Sample Members";

/**
 * Ensures that a map called "Sample Map" exists for
 * the provided organisation, with the choropleth visualisation set
 * to display the 2024 GE results.
 *
 * This file also includes the logic to ensure the data source exists,
 * and should be revisited when work on the movement library begins.
 */
const ensureOrganisationMap = async (orgId: string): Promise<Map> => {
  const maps = await findMapsByOrganisationId(orgId);
  let map = null;
  for (const m of maps) {
    if (m.name === MAP_NAME) {
      map = m;
      break;
    }
  }
  if (!map) {
    map = await createMap(orgId, MAP_NAME);
  }

  if (!map.config.membersDataSourceId) {
    const membersDataSource = await ensureMembersDataSource(orgId);
    await importDataSource({ dataSourceId: membersDataSource.id });
    await updateMap(map.id, {
      config: { ...map.config, membersDataSourceId: membersDataSource.id },
    });
  }

  const views = await findMapViewsByMapId(map.id);
  const electionResultsDataSource = await ensureElectionResultsDataSource();
  const electionResultsDataCount = await countDataRecordsForDataSource(
    electionResultsDataSource.id,
    null,
    null,
  );
  if (!electionResultsDataCount.count) {
    await importDataSource({ dataSourceId: electionResultsDataSource.id });
  }

  let viewWithElectionResults: MapView | null = null;
  for (const view of views) {
    const viewConfig = view.config;
    if (viewConfig.areaDataSourceId === electionResultsDataSource.id) {
      viewWithElectionResults = view;
    }
  }
  if (viewWithElectionResults) {
    return map;
  }

  await upsertMapView({
    name: "Example View",
    config: {
      areaDataColumn: "Lab",
      areaDataSourceId: electionResultsDataSource.id,
      areaSetGroupCode: AreaSetGroupCode.WMC24,
      calculationType: null,
      colorScheme: ColorScheme.GreenYellowRed,
      mapStyleName: MapStyleName.Light,
      reverseColorScheme: false,
      showBoundaryOutline: true,
      showLabels: true,
      showLocations: true,
      showMembers: true,
      showTurf: true,
    },
    mapId: map.id,
    position: 0,
    dataSourceViews: [],
  });

  return map;
};

const ensureMembersDataSource = async (orgId: string): Promise<DataSource> => {
  const url = "file://resources/dataSets/sampleMembers.csv?orgId=" + orgId;
  let dataSource = await findCSVDataSourceByUrlAndOrg(url, orgId);
  if (!dataSource) {
    dataSource = await createDataSource({
      name: MEMBERS_DATA_SOURCE_NAME,
      organisationId: orgId,
      autoEnrich: false,
      autoImport: false,
      config: { type: DataSourceType.CSV, url },
      columnRoles: { nameColumns: ["First name", "Last name"] },
      enrichments: [],
      geocodingConfig: {
        type: GeocodingType.Code,
        areaSetCode: AreaSetCode.PC,
        column: "Postcode",
      },
      columnDefs: [],
      public: false,
      recordType: DataSourceRecordType.Members,
    });
  }
  return dataSource;
};

const ensureElectionResultsDataSource = async (): Promise<DataSource> => {
  const commonKnowledgeOrg = await upsertOrganisation({
    name: ADMIN_ORGANISATION_NAME,
  });

  const url = "file://resources/dataSets/ge2024.csv";
  let dataSource = await findCSVDataSourceByUrlAndOrg(
    url,
    commonKnowledgeOrg.id,
  );
  if (!dataSource) {
    dataSource = await createDataSource({
      name: GE_DATA_SOURCE_NAME,
      organisationId: commonKnowledgeOrg.id,
      autoEnrich: false,
      autoImport: false,
      config: { type: DataSourceType.CSV, url },
      columnRoles: { nameColumns: ["Constituency name"] },
      enrichments: [],
      geocodingConfig: {
        type: GeocodingType.Code,
        areaSetCode: AreaSetCode.WMC24,
        column: "ONS ID",
      },
      columnDefs: [],
      public: true,
      recordType: DataSourceRecordType.Data,
    });
  }
  return dataSource;
};

export default ensureOrganisationMap;
