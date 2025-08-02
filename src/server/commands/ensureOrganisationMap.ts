import {
  AreaSetCode,
  AreaSetGroupCode,
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

const DATA_SOURCE_NAME = "2024 GE Results";

const ensureOrganisationMap = async (orgId: string): Promise<Map> => {
  const maps = await findMapsByOrganisationId(orgId);
  let map = null;
  for (const m of maps) {
    if (m.name === DATA_SOURCE_NAME) {
      map = m;
      break;
    }
  }
  if (!map) {
    map = await createMap(orgId, DATA_SOURCE_NAME);
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

  const newView: NewMapView = {
    name: "Example View",
    config: JSON.stringify(config),
    mapId: map.id,
    position: 0,
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
      name: "2024 GE Results",
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
