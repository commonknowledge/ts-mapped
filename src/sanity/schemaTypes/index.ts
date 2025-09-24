import { type SchemaTypeDefinition } from "sanity";
import { blockContentType } from "./blockContent";
import { featureSetType, featureType } from "./features";
import { newsSchema } from "./news";
import { solutionsType } from "./solutions";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    solutionsType,
    featureSetType,
    featureType,
    newsSchema,
  ],
};
