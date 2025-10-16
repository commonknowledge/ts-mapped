import { type SchemaTypeDefinition } from "sanity";
import { blockContentType } from "./blockContent";
import { featureSetType, featureType } from "./features";
import { newsSchema } from "./news";
import { solutionsType } from "./solutions";
import { youtubeType } from "./youtubeType";
import { aboutType } from "./about";
import { homepageVideosType } from "./homepageVideos";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    solutionsType,
    featureSetType,
    featureType,
    newsSchema,
    youtubeType,
    aboutType,
    homepageVideosType,
  ],
};
