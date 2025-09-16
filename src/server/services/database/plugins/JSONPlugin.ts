import { OperationNodeTransformer, sql } from "kysely";
import type {
  ColumnUpdateNode,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  ValueListNode,
  ValueNode,
  ValuesNode,
} from "kysely";

/**
 * Better handling of JSON serialization. Only works if *all* object/array fields
 * in the database are `jsonb` columns (excluding geometry types which are handled
 * by the higher priority PointPlugin).
 *
 * See: https://github.com/kysely-org/kysely/pull/138
 */
export class JSONPlugin implements KyselyPlugin {
  readonly #jsonTransformer: JSONTransformer;

  constructor() {
    this.#jsonTransformer = new JSONTransformer();
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#jsonTransformer.transformNode(args.node);
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return args.result;
  }
}

export class JSONTransformer extends OperationNodeTransformer {
  readonly #caster;
  readonly #serializer;

  constructor() {
    super();
    this.#caster = (serializedValue: unknown) =>
      sql`${serializedValue}::${sql.raw("jsonb")}`;
    this.#serializer = (parameter: unknown) => {
      if (
        parameter &&
        typeof parameter === "object" &&
        !(parameter instanceof Date)
      ) {
        return JSON.stringify(parameter);
      }
      return parameter;
    };
  }

  protected override transformValues(node: ValuesNode): ValuesNode {
    return super.transformValues({
      ...node,
      values: node.values.map((valueItemNode) => {
        if (valueItemNode.kind !== "PrimitiveValueListNode") {
          return valueItemNode;
        }

        return {
          kind: "ValueListNode",
          values: valueItemNode.values.map(
            (value) =>
              ({
                kind: "ValueNode",
                value,
              }) as ValueNode,
          ),
        } as ValueListNode;
      }),
    });
  }

  protected override transformValueList(node: ValueListNode): ValueListNode {
    return super.transformValueList({
      ...node,
      values: node.values.map((listNodeItem) => {
        if (listNodeItem.kind !== "ValueNode") {
          return listNodeItem;
        }

        const { value } = listNodeItem as ValueNode;

        const serializedValue = this.#serializer(value);

        if (value === serializedValue) {
          return listNodeItem;
        }

        return this.#caster(serializedValue).toOperationNode();
      }),
    });
  }

  protected override transformPrimitiveValueList(
    node: PrimitiveValueListNode,
  ): PrimitiveValueListNode {
    return {
      ...node,
      values: node.values.map(this.#serializer),
    };
  }

  protected transformColumnUpdate(node: ColumnUpdateNode): ColumnUpdateNode {
    const { value: valueNode } = node;

    if (valueNode.kind !== "ValueNode") {
      return super.transformColumnUpdate(node);
    }

    const { value } = valueNode as ValueNode;

    const serializedValue = this.#serializer(value);

    if (value === serializedValue) {
      return super.transformColumnUpdate(node);
    }

    return super.transformColumnUpdate({
      ...node,
      value: this.#caster(serializedValue).toOperationNode(),
    });
  }

  protected override transformValue(node: ValueNode): ValueNode {
    return {
      ...node,
      value: this.#serializer(node.value),
    };
  }
}
