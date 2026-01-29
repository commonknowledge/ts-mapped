import fs from "fs";
import { join } from "path";
import { sql } from "kysely";
import { AreaSetCode } from "@/server/models/AreaSet";
import {
  createAreaSet,
  findAreaSetByCode,
} from "@/server/repositories/AreaSet";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getBaseDir } from "@/server/utils";

const AREA_SET_CODE = AreaSetCode.W25;

const importWards = async () => {
  const wardsGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "wards.geojson",
  );
  if (!fs.existsSync(wardsGeojsonPath)) {
    logger.error(
      `File not found: ${wardsGeojsonPath}. Download from https://geoportal.statistics.gov.uk/datasets/6ba7cf950a504d82809131c945fe70f1_0/about`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await createAreaSet({
      name: "UK Wards 2025",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(wardsGeojsonPath, "utf8");
  const areas = JSON.parse(geojson) as {
    features: {
      properties: { WD25CD: string; WD25NM: string };
      geometry: unknown;
    }[];
  };
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.WD25CD;
    const name = feature.properties.WD25NM;
    await sql`INSERT INTO area (name, code, geography, area_set_id)
      VALUES (
        ${name},
        ${code},
        ST_SetSRID(
          ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}),
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

export default importWards;
