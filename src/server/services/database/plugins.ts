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

export class PointPlugin implements KyselyPlugin {
  readonly #transformer = new PointTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
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
