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

const AREA_SET_CODE = AreaSetCode.LAD25;

const importLADs = async () => {
  const lasGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "lads.geojson",
  );
  if (!fs.existsSync(lasGeojsonPath)) {
    logger.error(
      `File not found: ${lasGeojsonPath}. Download from https://www.data.gov.uk/dataset/bde3b6d9-23a7-4bf6-bb55-df7b439b713a/local-authority-districts-may-2025-boundaries-uk-bgc-v2`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await createAreaSet({
      name: "Local Authority Districts 2025",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(lasGeojsonPath, "utf8");
  const areas = JSON.parse(geojson) as {
    features: {
      properties: { LAD25CD: string; LAD25NM: string };
      geometry: unknown;
    }[];
  };
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.LAD25CD;
    const name = feature.properties.LAD25NM;
    await sql`INSERT INTO area (name, code, geography, area_set_id)
      VALUES (
        ${name},
        ${code},
        ST_Transform(
          ST_SetSRID(
            ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}),
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

export default importLADs;
