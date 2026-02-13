import fs from "fs";
import { join } from "path";
import { sql } from "kysely";
import {
  createAreaSet,
  findAreaSetByCode,
} from "@/server/repositories/AreaSet";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getBaseDir } from "@/server/utils";
import {
  type AreaSetMetadata,
  areaSetsMetadata,
} from "../../../resources/areaSets/index";
import type { AreaSetCode } from "@/server/models/AreaSet";

const loadAreaSetMetadata = (
  areaSetCode: AreaSetCode,
): AreaSetMetadata | null => {
  const metadata = areaSetsMetadata.find((item) => item.code === areaSetCode);
  if (!metadata) {
    logger.error(`No metadata found for area set code: ${areaSetCode}`);
    return null;
  }
  return metadata;
};

const importAreaSet = async (areaSetCode: AreaSetCode) => {
  const metadata = loadAreaSetMetadata(areaSetCode);
  if (!metadata) {
    return;
  }

  const geojsonPath = join(
    getBaseDir(),
    "resources",
    "areaSets",
    metadata.filename,
  );

  if (!fs.existsSync(geojsonPath)) {
    const downloadMsg = metadata.link ? ` Download from ${metadata.link}` : "";
    logger.error(`File not found: ${geojsonPath}.${downloadMsg}`);
    return;
  }

  let areaSet = await findAreaSetByCode(areaSetCode);
  if (!areaSet) {
    areaSet = await createAreaSet({
      name: metadata.name,
      code: areaSetCode,
    });
    logger.info(`Inserted area set ${areaSetCode}`);
  } else {
    logger.info(`Using area set ${areaSetCode}`);
  }

  const geojson = fs.readFileSync(geojsonPath, "utf8");
  const areas = JSON.parse(geojson) as {
    features: {
      properties: Record<string, string>;
      geometry: unknown;
    }[];
  };

  const count = areas.features.length;
  for (let i = 0; i < count; i++) {
    const feature = areas.features[i];
    const code = feature.properties[metadata.codeKey];
    const name = metadata.nameFormatter
      ? metadata.nameFormatter(feature.properties)
      : feature.properties[metadata.nameKey];

    if (metadata.isNationalGridSRID) {
      // Transform from British National Grid (EPSG:27700) to WGS84 (EPSG:4326)
      await sql`
        INSERT INTO area (name, code, geography, area_set_id)
        VALUES (
          ${name},
          ${code},
          ST_Transform(
            ST_SetSRID(
              ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}),
              27700
            ),
            4326
          )::geography,
          ${areaSet.id}
        )
        ON CONFLICT (code, area_set_id) DO UPDATE SET geography = EXCLUDED.geography;
      `.execute(db);
    } else {
      // Already in WGS84 (EPSG:4326)
      await sql`
        INSERT INTO area (name, code, geography, area_set_id)
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
    }

    const percentComplete = Math.floor((i * 100) / count);
    logger.info(`Inserted area ${code}. ${percentComplete}% complete`);
  }

  logger.info(
    `Completed import of ${metadata.name}, refreshing area search index...`,
  );

  // Refresh the materialized view for area search
  await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY area_search`.execute(db);
  logger.info("Area search index refreshed");
};

export default importAreaSet;
