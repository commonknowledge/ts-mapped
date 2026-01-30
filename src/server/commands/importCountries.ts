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

const AREA_SET_CODE = AreaSetCode.UKC24;

const importCountries = async () => {
  const countriesGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "countries.geojson",
  );
  if (!fs.existsSync(countriesGeojsonPath)) {
    logger.error(
      `File not found: ${countriesGeojsonPath}. Download from https://www.data.gov.uk/dataset/c0ebe11c-0c81-4eed-81b3-a0394d4116a9/countries-december-2024-boundaries-uk-bgc1`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await createAreaSet({
      name: "UK Countries",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(countriesGeojsonPath, "utf8");
  const areas = JSON.parse(geojson) as {
    features: {
      properties: { CTRY24NM: string; CTRY24CD: string };
      geometry: unknown;
    }[];
  };
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.CTRY24CD;
    const name = feature.properties.CTRY24NM;
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

export default importCountries;
