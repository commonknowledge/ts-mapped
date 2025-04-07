import fs from "fs";
import { join } from "path";
import { sql } from "kysely";
import { AreaSetCode } from "@/__generated__/types";
import {
  findAreaSetByCode,
  insertAreaSet,
} from "@/server/repositories/AreaSet";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getBaseDir } from "@/server/utils";

const AREA_SET_CODE = AreaSetCode.MSOA21;

const importMSOAs = async () => {
  const msoasGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "msoas.geojson",
  );
  if (!fs.existsSync(msoasGeojsonPath)) {
    logger.error(
      `File not found: ${msoasGeojsonPath}. Download from https://geoportal.statistics.gov.uk/datasets/ons::middle-layer-super-output-areas-december-2021-boundaries-ew-bgc-v3-2/about`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await insertAreaSet({
      name: "Middle Super Output Areas",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(msoasGeojsonPath, "utf8");
  const areas = JSON.parse(geojson);
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.MSOA21CD;
    const name = feature.properties.MSOA21NM;
    await sql`
      INSERT INTO area (name, code, geography, area_set_id)
      VALUES (
        ${name},
        ${code},
        ST_SetSRID(
          ST_GeomFromGeoJSON(${feature.geometry}),
          4326
        )::geography,
        ${areaSet.id}
      )
      ON CONFLICT (code, area_set_id) DO UPDATE SET geography = EXCLUDED.geography;
    `.execute(db);
    const percentComplete = Math.floor((i * 100) / count);
    logger.info(`Inserted area ${code}. ${percentComplete}% complete`);
  }
};

export default importMSOAs;
