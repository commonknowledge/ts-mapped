import {
  AreaSetCode,
  AreaSetGroupCode,
  DataSourceView,
  GeocodingType,
  MapStyleName,
  MapView,
  MapViewConfig,
} from "@/__generated__/types";
import { ADMIN_ORGANISATION_NAME } from "@/constants";
import importDataSource from "@/server/jobs/importDataSource";
import { DataSource } from "@/server/models/DataSource";
import { Map } from "@/server/models/Map";
import { NewMapView } from "@/server/models/MapView";
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
import { DataSourceType } from "@/types";
import { DataSourceConfig, GeocodingConfig } from "@/zod";

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

  const config: MapViewConfig = {
    areaDataColumn: "First party",
    areaDataSourceId: electionResultsDataSource.id,
    areaSetGroupCode: AreaSetGroupCode.WMC24,
    showBoundaryOutline: true,
    showLabels: true,
    showLocations: true,
    showMembers: true,
    showTurf: true,
    excludeColumnsString: "",
    mapStyleName: MapStyleName.Light,
  };

  const dataSourceViews: DataSourceView[] = [];

  const newView: NewMapView = {
    name: "Example View",
    config: JSON.stringify(config),
    mapId: map.id,
    position: 0,
    dataSourceViews: JSON.stringify(dataSourceViews),
  };
  await upsertMapView(newView);

  return map;
};

const ensureElectionResultsDataSource = async (): Promise<DataSource> => {
  const commonKnowledgeOrg = await upsertOrganisation({
    name: ADMIN_ORGANISATION_NAME,
  });

  const url = "file://resources/dataSets/ge2024.csv";
  let dataSource = await findCSVDataSourceByUrl(url);
  if (!dataSource) {
    const config: DataSourceConfig = {
      type: DataSourceType.csv,
      url,
    };
    const geocodingConfig: GeocodingConfig = {
      type: GeocodingType.Code,
      areaSetCode: AreaSetCode.WMC24,
      column: "ONS ID",
    };
    const newDataSource = {
      name: MAP_AND_DATA_SOURCE_NAME,
      organisationId: commonKnowledgeOrg.id,
      autoEnrich: false,
      autoImport: false,
      config: JSON.stringify(config),
      columnRoles: JSON.stringify({}),
      enrichments: JSON.stringify([]),
      geocodingConfig: JSON.stringify(geocodingConfig),
      columnDefs: JSON.stringify([]),
      public: true,
    };
    dataSource = await createDataSource(newDataSource);
  }
  return dataSource;
};

export default ensureOrganisationMap;
