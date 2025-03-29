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

const AREA_SET_CODE = AreaSetCode.PC;

const importPostcodes = async () => {
  const postcodeGeojsonDirPath = join(getBaseDir(), "resources", "areaSets");

  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await insertAreaSet({
      name: "UK Postcodes",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }

  for (let i = 1; i <= 10; i++) {
    logger.info(`Processing postcode file ${i} of 10`);

    const postcodeGeojsonPath = join(
      postcodeGeojsonDirPath,
      `postcodes_${i}.geojsonl`
    );
    if (!fs.existsSync(postcodeGeojsonPath)) {
      logger.error(
        `File not found: ${postcodeGeojsonPath}. Download from the Ordnance Survey website.`
      );
      return;
    }
    const geojsonL = fs.readFileSync(postcodeGeojsonPath, "utf8");
    const geojsonLines = geojsonL.split(/\r?\n/).filter(Boolean);
    const count = geojsonLines.length;
    for (let j = 0; j < count; j++) {
      const line = geojsonLines[j];
      const feature = JSON.parse(line);
      const name = feature.properties.POSTCODE;
      const code = name.replace(/\s+/g, "");
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
      const percentComplete = Math.floor((j * 100) / count);
      logger.info(`Inserted area ${name}. ${percentComplete}% complete`);
    }

    logger.info(`Processed postcode file ${i} of 10`);
  }
};

export default importPostcodes;
