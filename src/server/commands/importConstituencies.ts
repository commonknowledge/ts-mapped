import fs from "fs";
import { join } from "path";
import { sql } from "kysely";
import { AreaSetCode } from "@/__generated__/types";
import {
  createAreaSet,
  findAreaSetByCode,
} from "@/server/repositories/AreaSet";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getBaseDir } from "@/server/utils";

const AREA_SET_CODE = AreaSetCode.WMC24;

const importConstituencies = async () => {
  const constituenciesGeojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    "constituencies.geojson",
  );
  if (!fs.existsSync(constituenciesGeojsonPath)) {
    logger.error(
      `File not found: ${constituenciesGeojsonPath}. Download from https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-july-2024-boundaries-uk-bgc-2/about`,
    );
    return;
  }
  let areaSet = await findAreaSetByCode(AREA_SET_CODE);
  if (!areaSet) {
    areaSet = await createAreaSet({
      name: "Westminster Constituencies 2024",
      code: AREA_SET_CODE,
    });
    logger.info(`Inserted area set ${AREA_SET_CODE}`);
  } else {
    logger.info(`Using area set ${AREA_SET_CODE}`);
  }
  const geojson = fs.readFileSync(constituenciesGeojsonPath, "utf8");
  const areas = JSON.parse(geojson) as {
    features: {
      properties: { PCON24CD: string; PCON24NM: string };
      geometry: unknown;
    }[];
  };
  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties.PCON24CD;
    const name = feature.properties.PCON24NM;
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

export default importConstituencies;
