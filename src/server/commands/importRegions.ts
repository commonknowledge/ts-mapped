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

const AREA_SET_CODE = AreaSetCode.UKREGIONCOUNTRY18;

const importRegions = async () => {
  const regionsGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "regions.geojson",
  );
  if (!fs.existsSync(regionsGeojsonPath)) {
    logger.error(
      `File not found: ${regionsGeojsonPath}. Download from https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/932f769148bb4753989e55b6703b7add/geojson?layers=0`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await createAreaSet({
      name: "Regions & Nations",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(regionsGeojsonPath, "utf8");
  const areas = JSON.parse(geojson) as {
    features: {
      properties: { eer18cd: string; eer18nm: string };
      geometry: unknown;
    }[];
  };
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.eer18cd;
    const name = feature.properties.eer18nm;
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

export default importRegions;
