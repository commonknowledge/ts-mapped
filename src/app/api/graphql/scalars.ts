import { GraphQLScalarType, Kind } from "graphql";

export const GraphQLDate = new GraphQLScalarType({
  name: "Date",
  description: "A custom scalar that handles ISO 8601 dates",
  serialize(value: unknown): string {
    if (!(value instanceof Date)) {
      throw new TypeError(`Value is not a Date instance: ${value}`);
    }
    if (isNaN(value.getTime())) {
      throw new TypeError("Invalid Date");
    }
    return value.toISOString();
  },
  parseValue(value: unknown): Date {
    if (typeof value !== "string") {
      throw new TypeError(`Value is not a string: ${value}`);
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new TypeError("Invalid ISO 8601 date string");
    }
    return date;
  },
  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`Can only parse strings to dates, got: ${ast.kind}`);
    }
    const date = new Date(ast.value);
    if (isNaN(date.getTime())) {
      throw new TypeError("Invalid ISO 8601 date string in literal");
    }
    return date;
  },
});
