import { TUTORIAL_MAP_NAME } from "@/constants";
import importDataSource from "@/server/jobs/importDataSource";
import { countDataRecordsForDataSource } from "@/server/repositories/DataRecord";
import { createMap, updateMap } from "@/server/repositories/Map";
import {
  ensureElectionResultsDataSource,
  ensureMembersDataSource,
} from "./ensureOrganisationMap";
import type { DataSource } from "@/models/DataSource";

const ensureImported = async (dataSource: DataSource) => {
  const { total } = await countDataRecordsForDataSource(
    dataSource.id,
    null,
    null,
  );
  if (!total) await importDataSource({ dataSourceId: dataSource.id });
};

/**
 * A new, empty map for the light editor's guided tour. Its own copy of the
 * sample members ("Tutorial members") and the 2024 general election results
 * are made ready (imported if need be) but left off the map, so the tour
 * can have you add them.
 */
const createTutorialMap = async (organisationId: string) => {
  const members = await ensureMembersDataSource(organisationId, "tutorial");
  await ensureImported(members);
  const electionResults = await ensureElectionResultsDataSource();
  await ensureImported(electionResults);
  const map = await createMap(organisationId, TUTORIAL_MAP_NAME);
  // Recorded so the tour knows which data to point you to
  return updateMap(map.id, {
    config: {
      ...map.config,
      tutorial: {
        membersDataSourceId: members.id,
        areaDataSourceId: electionResults.id,
      },
    },
  });
};

export default createTutorialMap;
