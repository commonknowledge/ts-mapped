import {
  KyselyPlugin,
  OperationNodeTransformer,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  ValueNode,
} from "kysely";
import { Point } from "@/types";
import logger from "../../services/logger"; // Relative import required for Kysely CLI

export class PointPlugin implements KyselyPlugin {
  readonly #transformer = new PointTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    // Map all rows: if a value looks like a PostGIS point, convert to {lat, lng}
    const rows = args.result.rows.map((row) => mapDbRowPoints(row));
    return { ...args.result, rows };
  }
}

class PointTransformer extends OperationNodeTransformer {
  protected transformValue(node: ValueNode): ValueNode {
    return {
      ...node,
      value: isPoint(node.value) ? mapPoint(node.value) : node.value,
    };
  }

  protected transformPrimitiveValueList(
    node: PrimitiveValueListNode,
  ): PrimitiveValueListNode {
    return {
      ...node,
      values: node.values.map((it) => (isPoint(it) ? mapPoint(it) : it)),
    };
  }
}

function mapPoint(point: Point): string {
  return `SRID=4326;POINT(${point.lng} ${point.lat})`;
}

function isPoint(point: unknown): point is Point {
  return (
    typeof point === "object" &&
    point !== null &&
    "lat" in point &&
    "lng" in point
  );
}

// --- New: handle reading from DB ---
function mapDbRowPoints(row: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string" && isWkbHex(value)) {
      mapped[key] = parseDbPoint(value) ?? value;
    } else {
      mapped[key] = value;
    }
  }
  return mapped;
}

// Only handle WKB hex: e.g. '0101000020E6100000...'
function isWkbHex(val: string): boolean {
  return /^[0-9A-Fa-f]{40,}$/.test(val);
}

function parseDbPoint(val: string): Point | null {
  if (isWkbHex(val)) {
    try {
      const buf = Buffer.from(val, "hex");
      // WKB: [byte order][type][SRID][x][y]
      // byte order: 1 byte (0x01 = little endian)
      // type: 4 bytes
      // SRID: 4 bytes
      // x: 8 bytes (double)
      // y: 8 bytes (double)
      const littleEndian = buf[0] === 1;

      // Only handle SRID 4326
      const srid = littleEndian ? buf.readUInt32LE(5) : buf.readUInt32BE(5);

      if (srid !== 4326) {
        return null;
      }

      const x = littleEndian ? buf.readDoubleLE(9) : buf.readDoubleBE(9);
      const y = littleEndian ? buf.readDoubleLE(17) : buf.readDoubleBE(17);

      if (isNaN(x) || isNaN(y)) {
        return null;
      }

      return { lng: x, lat: y };
    } catch (e) {
      logger.error("Error parsing PostGIS point", e);
      return null;
    }
  }
  return null;
}
