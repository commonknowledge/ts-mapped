import fs from "fs";
import { join } from "path";
import { sql } from "kysely";
import {
  findAreaSetByCode,
  insertAreaSet,
} from "@/server/repositories/AreaSet";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getBaseDir } from "@/server/utils";
import { AreaSetCode } from "@/types";

const AREA_SET_CODE = AreaSetCode.OA21;

const importOutputAreas = async () => {
  const outputAreasGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "outputAreas.geojson",
  );
  if (!fs.existsSync(outputAreasGeojsonPath)) {
    logger.error(
      `File not found: ${outputAreasGeojsonPath}. Download from https://www.data.gov.uk/dataset/4d4e021d-fe98-4a0e-88e2-3ead84538537/output-areas-december-2021-boundaries-ew-bgc-v21`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await insertAreaSet({
      name: "Census Output Areas 2021",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(outputAreasGeojsonPath, "utf8");
  const areas = JSON.parse(geojson);
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.OA21CD;
    const name = `${feature.properties.LSOA21NM}: ${feature.properties.OA21CD}`;
    await sql`
      INSERT INTO area (name, code, geography, area_set_id)
      VALUES (
        ${name},
        ${code},
        ST_Transform(
          ST_SetSRID(
            ST_GeomFromGeoJSON(${feature.geometry}),
            27700  -- Set the original EPSG:27700 (British National Grid)
          ),
          4326  -- Convert to WGS 84
        )::geography,
        ${areaSet.id}
      )
      ON CONFLICT (code, area_set_id) DO UPDATE SET geography = EXCLUDED.geography;
    `.execute(db);
    const percentComplete = Math.floor((i * 100) / count);
    logger.info(`Inserted area ${code}. ${percentComplete}% complete`);
  }
};

export default importOutputAreas;
