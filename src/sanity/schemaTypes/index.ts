import { type SchemaTypeDefinition } from "sanity";
import { featureSetType, featureType } from "./features";
import { solutionsType } from "./solutions";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [solutionsType, featureSetType, featureType],
};
