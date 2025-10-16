import { type SchemaTypeDefinition } from "sanity";
import { aboutType } from "./about";
import { blockContentType } from "./blockContent";
import { featureSetType, featureType } from "./features";
import { homepageVideosType } from "./homepageVideos";
import { newsSchema } from "./news";
import { solutionsType } from "./solutions";
import { youtubeType } from "./youtubeType";

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
