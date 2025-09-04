import { ADMIN_ORGANISATION_NAME } from "@/constants";
import importDataSource from "@/server/jobs/importDataSource";
import {
  DataSource,
  DataSourceRecordType,
  DataSourceType,
  GeocodingType,
} from "@/server/models/DataSource";
import { Map } from "@/server/models/Map";
import {
  createDataSource,
  findCSVDataSourceByUrl,
} from "@/server/repositories/DataSource";
import { createMap, findMapsByOrganisationId } from "@/server/repositories/Map";
import {
  findMapViewsByMapId,
  upsertMapView,
} from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { AreaSetCode, AreaSetGroupCode } from "../models/AreaSet";
import { MapStyleName, MapView, VisualisationType } from "../models/MapView";

const MAP_AND_DATA_SOURCE_NAME = "2024 GE Results";

/**
 * Ensures that a map called `MAP_AND_DATA_SOURCE_NAME` exists for
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
    if (m.name === MAP_AND_DATA_SOURCE_NAME) {
      map = m;
      break;
    }
  }
  if (!map) {
    map = await createMap(orgId, MAP_AND_DATA_SOURCE_NAME);
  }

  const views = await findMapViewsByMapId(map.id);
  const electionResultsDataSource = await ensureElectionResultsDataSource();
  await importDataSource({ dataSourceId: electionResultsDataSource.id });

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
      areaDataColumn: "First party",
      areaDataSourceId: electionResultsDataSource.id,
      areaSetGroupCode: AreaSetGroupCode.WMC24,
      calculationType: null,
      colorScheme: null,
      excludeColumnsString: "",
      mapStyleName: MapStyleName.Light,
      showBoundaryOutline: true,
      showLabels: true,
      showLocations: true,
      showMembers: true,
      showTurf: true,
      visualisationType: VisualisationType.Choropleth,
    },
    mapId: map.id,
    position: 0,
    dataSourceViews: [],
  });

  return map;
};

const ensureElectionResultsDataSource = async (): Promise<DataSource> => {
  const commonKnowledgeOrg = await upsertOrganisation({
    name: ADMIN_ORGANISATION_NAME,
  });

  const url = "file://resources/dataSets/ge2024.csv";
  let dataSource = await findCSVDataSourceByUrl(url);
  if (!dataSource) {
    dataSource = await createDataSource({
      name: MAP_AND_DATA_SOURCE_NAME,
      organisationId: commonKnowledgeOrg.id,
      autoEnrich: false,
      autoImport: false,
      config: { type: DataSourceType.CSV, url },
      columnRoles: { nameColumns: [] },
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
