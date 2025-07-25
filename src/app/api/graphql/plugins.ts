import { Plugin } from "graphql-yoga";

// Remove __typename from Input objects
// (it is added by Apollo client and difficult to remove)
export const removeTypenamePlugin: Plugin = {
  onExecute({ args }) {
    args.variableValues = cleanTypename(args.variableValues);
  },
};

function cleanTypename(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(cleanTypename);
  } else if (obj !== null && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (key !== "__typename") {
        newObj[key] = cleanTypename((obj as Record<string, unknown>)[key]);
      }
    }
    return newObj;
  }
  return obj;
}
