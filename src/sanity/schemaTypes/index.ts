import { type SchemaTypeDefinition } from 'sanity'
import { solutionsType } from './solutions'
import { featureSetType, featureType } from './features'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [solutionsType, featureSetType, featureType],
}
